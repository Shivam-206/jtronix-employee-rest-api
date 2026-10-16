# JTRONIX Employee REST API

A simple Node.js and Express REST API with an in-memory employee array. No database or frontend is required.

## Install and run

Requires Node.js 20 or newer.

```bash
npm install
npm run dev
```

The server uses the `PORT` environment variable when provided, or defaults to port `3000`.

Run the automated tests with:

```bash
npm test
```

## Endpoints

| Method | Path | Purpose |
|---|---|---|
| GET | `/employees` | List all employees; optionally filter using `?department=Engineering` |
| GET | `/employees/:id` | Find an employee by numeric ID |
| POST | `/employees` | Add an employee with `name` and `department` |
| PATCH | `/employees/:id/status` | Set status to `Active` or `Inactive` |

Initial employees:

- Rahul Sharma — Engineering, Active
- Priya Patel — HR, Active
- Amit Verma — Engineering, Inactive

Every employee contains `id`, `name`, `department`, and `status`.

## Example requests

### List all employees

```bash
curl http://localhost:3000/employees
```

### Filter by department

```bash
curl "http://localhost:3000/employees?department=Engineering"
```

### Get one employee

```bash
curl http://localhost:3000/employees/1
```

### Add an employee

```bash
curl -X POST http://localhost:3000/employees \
  -H "Content-Type: application/json" \
  -d '{"name":"Neha Singh","department":"Engineering"}'
```

A successful request returns HTTP `201 Created`, with the generated ID and default status `Active`.

### Update employee status

```bash
curl -X PATCH http://localhost:3000/employees/1/status \
  -H "Content-Type: application/json" \
  -d '{"status":"Inactive"}'
```

## Error handling

Invalid IDs or request values return HTTP `400 Bad Request` where appropriate. Employees that do not exist return HTTP `404 Not Found`. Errors are JSON objects containing an `error` message.

## Data storage

Employee data is held in memory and resets when the server restarts.

## Code overview

- `src/index.js` configures Express, JSON parsing, routes, and the server port.
- `src/routes/employees.js` contains the initial employee data and route handlers.
- `test/api.test.js` checks successful responses and validation/error cases using Node's built-in test runner.
- `API_EXAMPLES.md` provides example API requests and responses.
