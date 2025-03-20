import { Hono } from "hono";
import { Database } from "bun:sqlite";
import { bearerAuth } from 'hono/bearer-auth'

// Initialize the SQLite database
const db = new Database("mydatabase.sqlite");

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
	server TEXT,
	notes TEXT,
	paid INTEGER NOT NULL DEFAULT 0,
	created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS order_items (
	id INTEGER PRIMARY KEY AUTOINCREMENT,
	order_id INTEGER NOT NULL,
	product_id INTEGER NOT NULL,
	quantity INTEGER NOT NULL
);
`);
const app = new Hono();

const Layout = (props) => {
	return (
		<html>
			<head>
				{/* <script src="https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4"></script> */}
			</head>
			<body>{props.children}</body>
		</html>
	);
};


app.get("/", (c) => {
	const products = db.query("SELECT * FROM products").all();
	const orders = db.query("SELECT * FROM orders").all();

	return c.html(<Layout>
		
		<h2>Products</h2>
		<ul class="ml-4">
			{products.map((p) => (
				<li key={p.id}>{p.name} - ${p.price}</li>
			))}
		</ul>

		<h2>Create order</h2>
		<form action="/order" method="post">
			<select name="product" id="product">
				{products.map((p) => (
					<option value={p.id} key={p.id}>{p.name} - ${p.price}</option>
				))}
			</select>
			<br />
			<label htmlFor="tax">Tax</label>
			<input type="number" name="tax" />
			<br />
			<label htmlFor="notes">Notes</label>
			<input type="text" name="notes" />
			<br />
			<label htmlFor="server">Server</label>
			<input type="text" name="server" />
			<button type="submit">create</button>
		</form>

		<h2>Orders</h2>
		<ul class="ml-4">
			{orders.map((o) => (
				<li key={o.id}>Order ID: {o.id} - Total: ${o.total}</li>
			))}
		</ul>
	</Layout>);
});

app.post("/order", async (c) => {
	const data = await c.req.formData();
	const product = data.get("product");
	const tax = data.get("tax")?.toString() || "0";
	const notes = data.get("notes");
	const server = data.get("server");

	// get product price
	const productPrice = db.query(`SELECT price FROM products WHERE id = ${product}`).get().price;
	const subtotal = productPrice; // This should be calculated based on the product selected
	const total = subtotal + parseFloat(tax);
	
	// Insert the order into the orders table
	db.exec(`INSERT INTO orders (subtotal, tax, total, server, notes) VALUES (${subtotal}, ${tax}, ${total}, "${server}", "${notes}")`);

	// Get the last inserted order ID
	const orderId = db.query("SELECT last_insert_rowid() as id").get().id;

	// Insert the order item into the order_items table
	db.exec(`INSERT INTO order_items (order_id, product_id, quantity) VALUES (${orderId}, ${product}, 1)`);

	return c.redirect("/");
})

app.get("/products", (c) => {
	const products = db.query("SELECT * FROM products").all();
	return c.json(products);
});

app.get("/orders", (c) => {
	const orders = db.query("SELECT * FROM orders").all();
	return c.json(orders);
});


app.get("/order/:orderId", (c) => {
	const orderId = c.req.param("orderId");
	const order = db.query(`SELECT * FROM orders WHERE id = ${orderId}`).get();
	const orderItems = db.query(`SELECT * FROM order_items WHERE order_id = ${orderId}`).all();
	const product = db.query(`SELECT * FROM products WHERE id = ${orderItems[0].product_id}`).get();
	orderItems[0].price = product.price;
	orderItems[0].name = product.name;

	return c.json({ order, orderItems });
}
);

const token = "123";
app.put("/order/update",  bearerAuth({ token }), async (c) => {
	const { id } = await c.req.json();
	console.log("Updating order with id: ", id);
	db.exec(`UPDATE orders SET paid=1 WHERE id = ${id}`);
	return c.json({ message: `Order ${id} updated` });
});
export default app;
