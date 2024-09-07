const express = require('express');
const multer = require('multer');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(cors()); 

// Configuración de almacenamiento de archivos (fotos)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, './uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, req.body.cc + path.extname(file.originalname)); 
  },
});

const upload = multer({ storage });

let citas = []; 

// Crear cita médica
app.post('/citas', upload.single('foto'), (req, res) => {
  const { cc, fecha } = req.body;
  const foto = req.file ? req.file.filename : null;

  const citaExistente = citas.find(cita => cita.cc === cc);
  if (citaExistente) {
    console.log(`Error: El paciente con CC ${cc} ya tiene una cita programada.`);
    return res.status(400).json({ mensaje: 'El paciente ya tiene una cita programada' });
  }
  const nuevaCita = { cc, fecha, foto, estado: 'activa' };
  citas.push(nuevaCita);

  console.log(`Cita médica creada: ${JSON.stringify(nuevaCita, null, 2)}`);

  res.json({ cc }); 
});

// Consultar citas por rango de fechas
app.get('/citas', (req, res) => {
  const { fechaInicio, fechaFin } = req.query;

  const citasEnRango = citas.filter(cita => {
    return new Date(cita.fecha) >= new Date(fechaInicio) && new Date(cita.fecha) <= new Date(fechaFin);
  });

  res.json(citasEnRango);
});

// Cancelar cita por CC
app.delete('/citas/:cc', (req, res) => {
  const { cc } = req.params;

  const cita = citas.find(c => c.cc === cc);
  if (cita) {
    cita.estado = 'cancelada';
    console.log(`Cita cancelada para el paciente con CC ${cc}.`);
    res.json({ mensaje: 'Cita cancelada' });
  } else {
    console.log(`Error: No se encontró una cita para el paciente con CC ${cc}.`);
    res.status(404).json({ mensaje: 'Cita no encontrada' });
  }
});

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
