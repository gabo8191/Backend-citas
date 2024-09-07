const express = require('express');
const multer = require('multer');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(cors());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, './uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, req.body.id_patient + path.extname(file.originalname));
  },
});

const upload = multer({ storage });

let appointment = [];

app.post('/appointment', upload.single('picture_auto'), async (req, res) => {
  const { customAlphabet } = await import('nanoid');
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const generateUniqueCode = customAlphabet(alphabet, 5);
  const code = generateUniqueCode();
  if (!req.body.id_patient || !req.body.date_appointment) {
    return res.status(400).json({ mensaje: 'Faltan campos obligatorios' });
  }
  const { id_patient, date_appointment } = req.body;
  const picture_auto = req.file ? req.file.filename : null;

  const existingCitation = appointment.find(appointment => appointment.id_patient === id_patient);
  if (existingCitation) {
    return res.status(400).json({ message: 'El paciente ya tiene una cita programada' });
  }
  const nuevaCita = { code, id_patient, date_appointment, picture_auto, status: 'activa' };
  appointment.push(nuevaCita);
  res.json({ code });
});

app.get('/appointment', (req, res) => {
  const { start_date_appointment, end_date_appointment } = req.query;

  if (!start_date_appointment || !end_date_appointment) {
    return res.status(400).json({ mensaje: 'No se ha esetablecido el rango de fechas correctamente' });
  }
  const appointmentEnRango = appointment.filter(appt => {
    return new Date(appt.date_appointment) >= new Date(start_date_appointment) &&
      new Date(appt.date_appointment) <= new Date(end_date_appointment);
  });

  res.json(appointmentEnRango);
});

app.get('/appointment/:code', (req, res) => {
  const { code } = req.params;
  const appt = appointment.find(c => c.code === code);
  if (appt) {
    res.json(appt);
  } else {
    res.status(404).json({ message: 'Cita no encontrada' });
  }
});


app.patch('/appointment/:code', (req, res) => {
  const { code } = req.params;
  const appt = appointment.find(c => c.code === code);
  if (appt) {
    appt.status = 'cancelada';
    res.json({ message: 'Cita cancelada' });
  } else {
    res.status(404).json({ message: 'Cita no encontrada' });
  }
});

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
