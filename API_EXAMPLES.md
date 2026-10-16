# JTRONIX Employee REST API — Request Examples

Base URL: `http://localhost:3000`

## 1. Get All Employees

**Request**

`GET /employees`

**Expected response:** HTTP 200 OK

Returns all employees as a JSON array.

## 2. Get Employee by ID

**Request**

`GET /employees/1`

**Expected response:** HTTP 200 OK

```json
{
  "id": 1,
  "name": "Rahul Sharma",
  "department": "Engineering",
  "status": "Active"
}
```

## 3. Get a Missing Employee

**Request**

`GET /employees/999`

**Expected response:** HTTP 404 Not Found

```json
{
  "error": "Employee with ID 999 was not found."
}
```

## 4. Create an Employee

**Request**

`POST /employees`

Content-Type: application/json

```json
{
  "name": "Neha Singh",
  "department": "Engineering"
}
```

**Expected response:** HTTP 201 Created

```json
{
  "id": 4,
  "name": "Neha Singh",
  "department": "Engineering",
  "status": "Active"
}
```

The generated ID may vary depending on the current in-memory data.

## 5. Reject Invalid Employee Data

**Request**

`POST /employees`

```json
{
  "name": "   ",
  "department": "Engineering"
}
```

**Expected response:** HTTP 400 Bad Request

```json
{
  "error": "Name is required and cannot be empty."
}
```

## 6. Update Employee Status

**Request**

`PATCH /employees/1/status`

Content-Type: application/json

```json
{
  "status": "Inactive"
}
```

**Expected response:** HTTP 200 OK

The response contains Rahul Sharma with status `Inactive`.

## 7. Reject an Invalid Status

**Request**

`PATCH /employees/1/status`

```json
{
  "status": "Pending"
}
```

**Expected response:** HTTP 400 Bad Request

## 8. Filter Employees by Department

**Request**

`GET /employees?department=Engineering`

**Expected response:** HTTP 200 OK

Returns only employees belonging to Engineering.

## 9. Update a Missing Employee

**Request**

`PATCH /employees/999/status`

```json
{
  "status": "Active"
}
```

**Expected response:** HTTP 404 Not Found

## Running the API

Install dependencies:

`npm install`

Start the API using the project's configured start command.

Run automated tests:

`npm test`