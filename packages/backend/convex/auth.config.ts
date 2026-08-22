import { authKit } from "./auth/index";

export default {
  providers: authKit.getAuthConfigProviders(),
};
