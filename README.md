# Mthree-Final

Final Capstone Project for Sakib and Jeter

## Springboot Generation

![Springboot Generation](Springboot.png)

## Rest Api Documentation

- Similar to the autogernated documentation used with swagger fast api
- Accessed through the url `http://localhost:8080/docs`

# Database

- financeDB
  - Schemas
    - Users
      - id : BIGINT , auto generated, primary key, not null
      - email : VARCHAR(255), non-repeatable, not null
      - password : VARCHAR(255), not null
      - created_at : DATE, not null
      - last_login : DATE
