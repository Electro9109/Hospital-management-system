const oracledb = require('oracledb');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

(async () => {
  try {
    const conn = await oracledb.getConnection({
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      connectionString: process.env.DB_CONNECT_STRING
    });
    console.log('✅ Connected to Oracle');
    
    // Create BILLING table
    const sql = `CREATE TABLE BILLING (
        bill_id NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        appointment_id NUMBER NOT NULL,
        patient_id NUMBER NOT NULL,
        total_amount NUMBER(10,2),
        payment_status VARCHAR2(20) DEFAULT 'Unpaid' CHECK (payment_status IN ('Paid','Unpaid')),
        payment_method VARCHAR2(50),
        generated_at DATE DEFAULT SYSDATE,
        CONSTRAINT fk_bill_appt FOREIGN KEY (appointment_id) REFERENCES APPOINTMENT(appointment_id),
        CONSTRAINT fk_bill_patient FOREIGN KEY (patient_id) REFERENCES PATIENT(patient_id)
      )`;
    
    await conn.execute(sql);
    console.log('✅ BILLING table created');
    await conn.close();
  } catch(e) {
    console.error('❌ Error:', e.message);
    process.exit(1);
  }
})();
