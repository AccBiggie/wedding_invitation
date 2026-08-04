import mongoose from 'mongoose'; import app from './app.js'; import { env } from './config/env.js'; import { seedAdmin } from './config/seedAdmin.js';
mongoose.connect(env.mongoUri).then(seedAdmin).then(()=>app.listen(env.port,()=>console.log(`API em http://localhost:${env.port}`))).catch(err=>{console.error('MongoDB:',err.message);process.exit(1);});
