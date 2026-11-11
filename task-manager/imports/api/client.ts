import { createClient } from "meteor-rpc";

import type { TaskApi } from "./tasks";

export const api = createClient<TaskApi>();
