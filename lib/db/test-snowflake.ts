import snowflake from 'snowflake-sdk';

function createSnowflakeConnection() {
  return snowflake.createConnection({
    account: process.env.SNOWFLAKE_ACCOUNT,
    username: process.env.SNOWFLAKE_USERNAME,
    password: process.env.SNOWFLAKE_PASSWORD,
    warehouse: process.env.SNOWFLAKE_WAREHOUSE,
    database: process.env.SNOWFLAKE_DATABASE
  });
}

async function testConnection() {
  console.log('Testing Snowflake connection...');
  console.log('Connection details:', {
    account: process.env.SNOWFLAKE_ACCOUNT,
    username: process.env.SNOWFLAKE_USERNAME,
    warehouse: process.env.SNOWFLAKE_WAREHOUSE,
    database: process.env.SNOWFLAKE_DATABASE,
  });
  
  const connection = createSnowflakeConnection();
  
  connection.connect((err) => {
    if (err) {
      console.error('Connection failed:', err);
      process.exit(1);
    }
    
    console.log('Successfully connected to Snowflake!');
    
    // List available tables
    connection.execute({
      sqlText: "SHOW TABLES",
      complete: (err, stmt, rows) => {
        if (err) {
          console.error('Failed to list tables:', err);
        } else {
          console.log('Available tables:', rows.map(r => r.name));
        }
        
        // Always terminate the connection
        connection.destroy();
      }
    });
  });
}

testConnection(); 