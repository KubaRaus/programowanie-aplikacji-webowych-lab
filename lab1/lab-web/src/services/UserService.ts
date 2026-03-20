import type { User } from "../models/User";

const MOCK_USERS: User[] = [
  {
    id: "user-1",
    firstName: "Jan",
    lastName: "Kowalski",
    role: "admin",
  },
  {
    id: "user-2",
    firstName: "Anna",
    lastName: "Nowak",
    role: "developer",
  },
  {
    id: "user-3",
    firstName: "Piotr",
    lastName: "Zielinski",
    role: "devops",
  },
];

export class UserService {
  getLoggedInUser(): User {
    return MOCK_USERS[0];
  }

  getUsers(): User[] {
    return MOCK_USERS;
  }

  getUserById(id: string): User | undefined {
    return MOCK_USERS.find((user) => user.id === id);
  }

  getAssignableUsers(): User[] {
    return MOCK_USERS.filter(
      (user) => user.role === "developer" || user.role === "devops",
    );
  }
}
