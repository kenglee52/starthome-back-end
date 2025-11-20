import express from "express";
import bodyParser from "body-parser";
import provinceRoutes from "./routes/province.routes";
import districtRoutes from "./routes/district.routes";
import ownerRoutes from "./routes/owner.routes";
import roleRoutes from "./routes/role.routes";
import productRoutes from "./routes/product.router";
import productTypeRoutes from "./routes/product_type.routes";
import positionRoutes from "./routes/position.routes";
import employeeRoutes from "./routes/employee.routes";
import userRoutes from "./routes/user.routes";
import incomeRoutes from "./routes/income.routes";
import expenseRoutes from "./routes/expense.routes";
import currencyRoutes from "./routes/currency.routes";
import cors from 'cors';
import path from "path";
const app = express();

app.use(express.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());
app.use(cors({origin:'*'}));
app.use('/uploads', express.static(path.join(__dirname, '../temp_uploads')));


app.use("/api/provinces", provinceRoutes);
app.use("/api/districts",districtRoutes);
app.use("/api/owners", ownerRoutes);
app.use("/api/roles", roleRoutes);
app.use("/api/products", productRoutes);
app.use("/api/producttypes", productTypeRoutes);
app.use("/api/positions", positionRoutes);
app.use("/api/employees", employeeRoutes);
app.use("/api/users", userRoutes);
app.use("/api/incomes", incomeRoutes);
app.use("/api/expense", expenseRoutes);
app.use("/api/currencies", currencyRoutes);
app.get("/", (req, res) => res.send("API is running 🚀"));


export default app;