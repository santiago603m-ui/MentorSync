import mongoose from 'mongoose';

export const conexionDB = async () => {
try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Conexion Exitosa Con Mongo DB");
} catch (error) {
    console.error("Error Al Conectar La Base De Datos", error.message);
    process.exit(1);
}
}