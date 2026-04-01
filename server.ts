import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // In-memory storage for bookings (Note: This will reset when the server restarts)
  const bookings: any[] = [];

  // API route for booking
  app.post("/api/book", async (req, res) => {
    const { name, email, phone, message, date, times } = req.body;
    const newBooking = { 
      id: Date.now().toString(),
      name, 
      email, 
      phone, 
      message, 
      date, 
      times,
      createdAt: new Date().toISOString()
    };
    
    bookings.push(newBooking);
    console.log("Booking saved:", newBooking);

    res.json({ success: true, message: "Booking confirmed and saved to dashboard." });
  });

  // API route to get all bookings (Admin only)
  app.get("/api/bookings", (req, res) => {
    // In a real app, you'd add authentication here
    res.json({ success: true, bookings });
  });

  // API route for students to find their bookings
  app.get("/api/my-bookings", (req, res) => {
    const { query } = req.query;
    if (!query) return res.status(400).json({ success: false, error: "Query is required" });
    
    const filtered = bookings.filter(b => 
      b.email.toLowerCase() === (query as string).toLowerCase() || 
      b.phone.replace(/[^0-9]/g, "") === (query as string).replace(/[^0-9]/g, "")
    );
    
    res.json({ success: true, bookings: filtered });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
