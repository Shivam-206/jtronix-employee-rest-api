import { Router } from "express";

const router = Router();

// This array is the API's in-memory data store. It resets when the server restarts.
const employees = [
  { id: 1, name: "Rahul Sharma", department: "Engineering", status: "Active" },
  { id: 2, name: "Priya Patel", department: "HR", status: "Active" },
  { id: 3, name: "Amit Verma", department: "Engineering", status: "Inactive" },
];

let nextEmployeeId = 4;

function parseEmployeeId(idText) {
  if (!/^\d+$/.test(idText)) {
    return null;
  }

  const id = Number(idText);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

function isRequestObject(body) {
  return body !== null && typeof body === "object" && !Array.isArray(body);
}

router.get("/", (req, res) => {
  const { department } = req.query;

  if (department !== undefined && typeof department !== "string") {
    return res.status(400).json({ error: "Department must be a single text value." });
  }

  const result =
    department === undefined
      ? employees
      : employees.filter((employee) => employee.department === department);

  return res.json(result);
});

router.get("/:id", (req, res) => {
  const id = parseEmployeeId(req.params.id);
  if (id === null) {
    return res.status(400).json({ error: "Employee ID must be a positive integer." });
  }

  const employee = employees.find((item) => item.id === id);
  if (!employee) {
    return res.status(404).json({ error: `Employee with ID ${id} was not found.` });
  }

  return res.json(employee);
});

router.post("/", (req, res) => {
  if (!isRequestObject(req.body)) {
    return res.status(400).json({ error: "Request body must be a JSON object." });
  }

  const { name, department } = req.body;
  if (typeof name !== "string" || name.trim() === "") {
    return res.status(400).json({ error: "Name is required and cannot be empty." });
  }

  if (typeof department !== "string" || department.trim() === "") {
    return res.status(400).json({ error: "Department is required and cannot be empty." });
  }

  const employee = {
    id: nextEmployeeId,
    name: name.trim(),
    department: department.trim(),
    status: "Active",
  };

  employees.push(employee);
  nextEmployeeId += 1;

  return res.status(201).json(employee);
});

router.patch("/:id/status", (req, res) => {
  const id = parseEmployeeId(req.params.id);
  if (id === null) {
    return res.status(400).json({ error: "Employee ID must be a positive integer." });
  }

  const employee = employees.find((item) => item.id === id);
  if (!employee) {
    return res.status(404).json({ error: `Employee with ID ${id} was not found.` });
  }

  if (!isRequestObject(req.body) || !["Active", "Inactive"].includes(req.body.status)) {
    return res.status(400).json({ error: 'Status must be either "Active" or "Inactive".' });
  }

  employee.status = req.body.status;
  return res.json(employee);
});

export default router;
