import { createClient } from '../lib/connection.js';
import bcrypt from 'bcryptjs';

async function addHrUser() {
    const client = createClient();

    try {
        console.log('Connecting to database...');
        await client.connect();
        console.log('Connected successfully!');

        const email = 'madina.kimadi.1994@gmail.com';
        const password = 'password123';
        
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);
        
        console.log('Generated password hash');

        const existing = await client.query(
            'SELECT id, email, role FROM employees WHERE email = $1',
            [email]
        );

        if (existing.rows.length > 0) {
            console.log('User already exists! Updating password...');
            await client.query(
                'UPDATE employees SET password_hash = $1, role = $2, status = $3 WHERE email = $4',
                [passwordHash, 'hr', 'active', email]
            );
            console.log('User updated successfully!');
        } else {
            console.log('Creating new HR user...');
            await client.query('INSERT INTO employees (iin, full_name, email, phone, role, status, password_hash, base_rate, hired_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)', [
                '910506350166', 'Madina Kimadi', email, '+77771234567', 'hr', 'active', passwordHash, 85000, new Date().toISOString()
            ]);
            console.log('HR user created successfully!');
        }

        const result = await client.query('SELECT id, email, full_name, role, status FROM employees WHERE email = $1', [email]);
        console.log('User Details:');
        console.log('  Email: ' + result.rows[0].email);
        console.log('  Name: ' + result.rows[0].full_name);
        console.log('  Role: ' + result.rows[0].role);
        console.log('  Status: ' + result.rows[0].status);
        console.log('Login Credentials:');
        console.log('  Email: ' + email);
        console.log('  Password: ' + password);
        console.log('You can now login with these credentials!');

    } catch (error) {
        console.error('Error:', error.message);
        process.exit(1);
    } finally {
        await client.end();
        console.log('Disconnected from database');
    }
}

addHrUser();
