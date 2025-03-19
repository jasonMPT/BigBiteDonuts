import { Hono } from 'hono'
import { Database } from "bun:sqlite";

// Initialize the SQLite database
const db = new Database('mydatabase.sqlite');

// Create tables if they don't exist
db.exec(`
  CREATE TABLE IF NOT EXISTS products (
	id INTEGER PRIMARY KEY AUTOINCREMENT,
	name TEXT NOT NULL,
	price REAL NOT NULL
  );
  CREATE TABLE IF NOT EXISTS orders (
	id INTEGER PRIMARY KEY AUTOINCREMENT,
	subtotal REAL NOT NULL,
	tax REAL NOT NULL,
	total REAL NOT NULL,
	server TEXT NOT NULL,
	notes TEXT,
	created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS order_items (
	id INTEGER PRIMARY KEY AUTOINCREMENT,
	order_id INTEGER NOT NULL,
	product_id INTEGER NOT NULL,
	quantity INTEGER NOT NULL
);
`);
const app = new Hono()

app.get('/', (c) => {
  return c.text('Hello Hono!')
})

app.get('/products', (c) => {
  const products = db.query("SELECT * FROM products").all();
  return c.json(products);
})

app.get('/orders', (c) => {	
	  const orders = db.query("SELECT * FROM orders").all();
  return c.json(orders);
});




export default app
