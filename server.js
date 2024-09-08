const express = require('express');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(cors({
  origin: 'http://localhost'
}));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
let index = 0;
// Configuración de almacenamiento de multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = './uploads/';
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath);
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    cb(null, req.body.id_patient+index+ path.extname(file.originalname));
    index++;
  },
});

const upload = multer({ storage });

let appointment = [];

app.post('/appointment', upload.single('picture_auto'), async (req, res) => {
  // Validación de campos obligatorios
  if (!req.body.id_patient || !req.body.date_appointment) {
    if (req.file) {
      fs.unlinkSync(req.file.path); // Elimina la imagen si se subió, pero los datos no son válidos
    }
    return res.status(400).json({ message: 'Faltan campos obligatorios' });
  }

  const { id_patient, date_appointment } = req.body;

  // Verifica si el paciente ya tiene una cita
  const existingCitation = appointment.find(appointment => appointment.id_patient === id_patient);
  if (existingCitation) {
    // Si el paciente ya tiene una cita, no sobreescribir la imagen
    if (req.file) {
      fs.unlinkSync(req.file.path); // Elimina la nueva imagen subida
    }
    return res.status(400).json({ message: 'El paciente ya tiene una cita programada, no se permite modificar la imagen.' });
  }

  const { customAlphabet } = await import('nanoid');
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const generateUniqueCode = customAlphabet(alphabet, 5);
  const code = generateUniqueCode();

  // Si todo está bien, guarda la cita y la imagen
  const picture_auto = req.file ? req.file.filename : null;
  const nuevaCita = { code, id_patient, date_appointment, picture_auto, status: 'activa' };
  appointment.push(nuevaCita);

  res.json({ code });
});

app.get('/appointment', (req, res) => {
  const { start_date_appointment, end_date_appointment } = req.query;

  if (!start_date_appointment || !end_date_appointment) {
    return res.status(400).json({ message: 'No se ha establecido el rango de fechas correctamente' });
  }

  const appointmentEnRango = appointment.filter(appt => {
    return new Date(appt.date_appointment) >= new Date(start_date_appointment) &&
      new Date(appt.date_appointment) <= new Date(end_date_appointment);
  });

  if (appointmentEnRango.length === 0) {
    return res.status(404).json({ message: 'No se encontraron citas en el rango de fechas' });
  }
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
    if (appt.status === 'cancelada') {
      return res.status(400).json({ message: 'La cita ya se encuentra cancelada' });
    } else {
      appt.status = 'cancelada';
      res.json({ message: 'Cita cancelada' });
    }
  } else {
    res.status(404).json({ message: 'Cita no encontrada' });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
