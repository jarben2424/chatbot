import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function setupDatabase() {
  try {
    // Create tables
    await supabase.from('products').delete();
    await supabase.from('customers').delete();
    await supabase.from('sales').delete();
    await supabase.from('employee_performance').delete();

    // Create tables using Supabase's interface or run these SQL commands:
    const { error: createError } = await supabase.rpc('setup_warehouse_tables', {
      sql: `
        CREATE TABLE IF NOT EXISTS products (
          id SERIAL PRIMARY KEY,
          name VARCHAR(100),
          category VARCHAR(50),
          price DECIMAL(10,2),
          stock_quantity INTEGER
        );

        CREATE TABLE IF NOT EXISTS customers (
          id SERIAL PRIMARY KEY,
          name VARCHAR(100),
          email VARCHAR(100),
          country VARCHAR(50),
          joined_date DATE
        );

        CREATE TABLE IF NOT EXISTS sales (
          id SERIAL PRIMARY KEY,
          product_id INTEGER REFERENCES products(id),
          customer_id INTEGER REFERENCES customers(id),
          sale_date DATE,
          quantity INTEGER,
          total_amount DECIMAL(10,2)
        );

        CREATE TABLE IF NOT EXISTS employee_performance (
          id SERIAL PRIMARY KEY,
          employee_name VARCHAR(100),
          department VARCHAR(50),
          sales_target DECIMAL(10,2),
          sales_achieved DECIMAL(10,2),
          evaluation_date DATE
        );
      `
    });

    if (createError) throw createError;

    // Insert sample data
    const { error: productsError } = await supabase
      .from('products')
      .insert([
        { name: 'Laptop Pro', category: 'Electronics', price: 1299.99, stock_quantity: 50 },
        { name: 'Smartphone X', category: 'Electronics', price: 899.99, stock_quantity: 100 },
        { name: 'Office Chair', category: 'Furniture', price: 199.99, stock_quantity: 30 },
        { name: 'Coffee Maker', category: 'Appliances', price: 79.99, stock_quantity: 25 },
        { name: 'Wireless Earbuds', category: 'Electronics', price: 159.99, stock_quantity: 75 }
      ]);

    if (productsError) throw productsError;

    const { error: customersError } = await supabase
      .from('customers')
      .insert([
        { name: 'John Smith', email: 'john@example.com', country: 'USA', joined_date: '2023-01-15' },
        { name: 'Emma Wilson', email: 'emma@example.com', country: 'UK', joined_date: '2023-02-20' },
        { name: 'Luis Garcia', email: 'luis@example.com', country: 'Spain', joined_date: '2023-03-10' },
        { name: 'Marie Dubois', email: 'marie@example.com', country: 'France', joined_date: '2023-04-05' },
        { name: 'Alex Chen', email: 'alex@example.com', country: 'Canada', joined_date: '2023-05-01' }
      ]);

    if (customersError) throw customersError;

    // ... similar inserts for sales and employee_performance

    console.log('Database setup completed successfully');
  } catch (error) {
    console.error('Error setting up database:', error);
  }
}

setupDatabase(); 