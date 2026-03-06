import type { User } from "../models/User";

const MOCK_USER: User = {
  id: "user-1",
  firstName: "Jan",
  lastName: "Kowalski",
};

export class UserService {
  getLoggedInUser(): User {
    return MOCK_USER;
  }
}
