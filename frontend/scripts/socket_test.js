import { io } from 'socket.io-client';

function wait(ms){ return new Promise(r=>setTimeout(r, ms)); }

async function run(){
  const port = process.env.PORT || 3000;
  const url = `http://localhost:${port}`;
  const a = io(url);
  const b = io(url);

  a.on('connect', ()=>{
    console.log('A connected', a.id);
    a.emit('join','1');
  });
  b.on('connect', ()=>{
    console.log('B connected', b.id);
    b.emit('join','2');
  });

  a.on('new_message', (msg)=> console.log('A received new_message', msg));
  b.on('new_message', (msg)=> console.log('B received new_message', msg));

  // wait for both to connect
  await wait(1000);

  console.log('A sending message to B');
  a.emit('send_message', { sender_id: '1', receiver_id: '2', message: 'Hello from A'}, (ack)=>{
    console.log('A got ack', ack);
  });

  // also try REST POST fallback
  await wait(500);
  console.log('Triggering /debug/emit to simulate server emit');
  try{
    const res = await fetch(`${url}/debug/emit`, { method: 'POST', headers: { 'Content-Type':'application/json'}, body: JSON.stringify({ sender_id:'1', receiver_id:'2', message:'test debug' })});
    const d = await res.json();
    console.log('/debug/emit response', d);
  }catch(e){ console.error('debug emit failed', e); }

  // wait to observe messages
  await wait(2000);
  a.close(); b.close();
  process.exit(0);
}

run().catch(e=>{ console.error(e); process.exit(1); });
