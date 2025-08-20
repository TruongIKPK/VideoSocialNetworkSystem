import { NextResponse } from 'next/server';
import { connectDB } from '../mongodb/route';

export async function GET() {
  try {
    // Check database connection
    const db = await connectDB();
    await db.command({ ping: 1 });

    // Basic health check response
    const healthStatus = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        database: 'connected',
        application: 'running'
      },
      uptime: process.uptime(),
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024)
      }
    };

    return NextResponse.json(healthStatus, { status: 200 });
  } catch (error) {
    const errorStatus = {
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error.message,
      services: {
        database: 'disconnected',
        application: 'running'
      }
    };

    return NextResponse.json(errorStatus, { status: 503 });
  }
}