const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

let currentTicket = 0;
let ticketQueue = [];
let attendedTickets = 0;
let ticketsByDay = {};
let messages = [];

app.use(express.static(path.join(__dirname, 'public')));

io.on('connection', (socket) => {
  console.log('A user connected');

  socket.emit('state', {
    currentTicket,
    ticketQueue,
    attendedTickets,
    ticketsByDay,
    messages
  });

  socket.on('nextTicket', () => {
    currentTicket++;
    ticketQueue.push(currentTicket);
    attendedTickets++;
    
    const today = new Date().toISOString().split('T')[0];
    if (!ticketsByDay[today]) {
      ticketsByDay[today] = 0;
    }
    ticketsByDay[today]++;

    io.emit('state', {
      currentTicket,
      ticketQueue: ticketQueue.slice(-3).reverse(),
      attendedTickets,
      ticketsByDay,
      messages
    });

    io.emit('playSound');
  });

  socket.on('resetTickets', () => {
    currentTicket = 0;
    ticketQueue = [];
    attendedTickets = 0;
    ticketsByDay = {};
    io.emit('state', {
      currentTicket,
      ticketQueue,
      attendedTickets,
      ticketsByDay,
      messages
    });
  });

  socket.on('newMessage', (message) => {
    messages.push(message);
    io.emit('message', message);
  });

  socket.on('disconnect', () => {
    console.log('A user disconnected');
  });
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/call-ticket', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'call-ticket.html'));
});

app.get('/stats', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'stats.html'));
});

app.get('/chat', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'chat.html'));
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
