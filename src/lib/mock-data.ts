
import { Project, ProjectDocument, DataModel } from "@/types";

// Projects mock data
export const projects: Project[] = [
  {
    id: "p1",
    name: "Child Welfare System",
    type: "Child Welfare",
    details: "A comprehensive system to manage child welfare cases, including case management, reporting, and analytics.",
    createdAt: "2023-10-15T10:30:00Z",
    updatedAt: "2023-11-20T08:45:00Z"
  },
  {
    id: "p2",
    name: "Child Support Portal",
    type: "Child Support",
    details: "Web-based portal for managing child support payments, case tracking, and document management.",
    createdAt: "2023-09-05T14:20:00Z",
    updatedAt: "2023-11-15T11:10:00Z"
  },
  {
    id: "p3",
    name: "Juvenile Case Management",
    type: "Juvenile Justice",
    details: "System for tracking juvenile offenders, court proceedings, and rehabilitation programs.",
    createdAt: "2023-08-22T09:15:00Z",
    updatedAt: "2023-10-30T16:25:00Z"
  }
];

// Project Documents mock data
export const documents: ProjectDocument[] = [
  {
    id: "d1",
    projectId: "p1",
    name: "Child Welfare Data Model",
    type: "data-model",
    fileUrl: "/mock/data-model.json",
    fileType: "application/json",
    uploadedAt: "2023-10-16T11:30:00Z"
  },
  {
    id: "d2",
    projectId: "p1",
    name: "Child Welfare Requirements",
    type: "system-requirements",
    fileUrl: "/mock/requirements.pdf",
    fileType: "application/pdf",
    uploadedAt: "2023-10-16T11:35:00Z"
  },
  {
    id: "d3",
    projectId: "p2",
    name: "Child Support Data Model",
    type: "data-model",
    fileUrl: "/mock/data-model2.json",
    fileType: "application/json",
    uploadedAt: "2023-09-06T10:20:00Z"
  }
];

// Sample data model for development
export const sampleDataModel: DataModel = {
  entities: [
    {
      id: "e1",
      name: "Person",
      definition: "An individual in the system",
      type: "entity",
      attributes: [
        {
          id: "a1",
          name: "id",
          type: "uuid",
          required: true,
          isPrimaryKey: true,
          description: "Unique identifier"
        },
        {
          id: "a2",
          name: "firstName",
          type: "string",
          required: true,
          description: "Person's first name"
        },
        {
          id: "a3",
          name: "lastName",
          type: "string",
          required: true,
          description: "Person's last name"
        },
        {
          id: "a4",
          name: "dateOfBirth",
          type: "date",
          required: true,
          description: "Person's birth date"
        }
      ]
    },
    {
      id: "e2",
      name: "Case",
      definition: "A welfare case in the system",
      type: "entity",
      attributes: [
        {
          id: "a5",
          name: "id",
          type: "uuid",
          required: true,
          isPrimaryKey: true,
          description: "Unique identifier"
        },
        {
          id: "a6",
          name: "caseNumber",
          type: "string",
          required: true,
          description: "Case reference number"
        },
        {
          id: "a7",
          name: "openDate",
          type: "date",
          required: true,
          description: "Date the case was opened"
        },
        {
          id: "a8",
          name: "status",
          type: "string",
          required: true,
          description: "Current case status"
        },
        {
          id: "a9",
          name: "assignedWorkerId",
          type: "uuid",
          required: true,
          isForeignKey: true,
          description: "Worker assigned to the case"
        }
      ]
    },
    {
      id: "e3",
      name: "Address",
      definition: "Physical location information",
      type: "sub-entity",
      attributes: [
        {
          id: "a10",
          name: "id",
          type: "uuid",
          required: true,
          isPrimaryKey: true,
          description: "Unique identifier"
        },
        {
          id: "a11",
          name: "personId",
          type: "uuid",
          required: true,
          isForeignKey: true,
          description: "Person this address belongs to"
        },
        {
          id: "a12",
          name: "street",
          type: "string",
          required: true,
          description: "Street address"
        },
        {
          id: "a13",
          name: "city",
          type: "string",
          required: true,
          description: "City name"
        },
        {
          id: "a14",
          name: "state",
          type: "string",
          required: true,
          description: "State code"
        },
        {
          id: "a15",
          name: "postalCode",
          type: "string",
          required: true,
          description: "Postal/ZIP code"
        }
      ]
    }
  ],
  relationships: [
    {
      id: "r1",
      name: "PersonAddress",
      sourceEntityId: "e1",
      targetEntityId: "e3",
      sourceCardinality: "1",
      targetCardinality: "*",
      description: "A person can have multiple addresses"
    },
    {
      id: "r2",
      name: "CaseWorker",
      sourceEntityId: "e2",
      targetEntityId: "e1",
      sourceCardinality: "*",
      targetCardinality: "1",
      description: "A worker can be assigned to multiple cases"
    }
  ]
};
