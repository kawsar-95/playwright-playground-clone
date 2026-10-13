import type { PageModule } from "../pageTypes";
import { pages as basic } from "./basic";
import { pages as locators } from "./locators";
import { pages as dynamic } from "./dynamic";
import { pages as forms } from "./forms";
import { pages as auth } from "./auth";
import { pages as tables } from "./tables";
import { pages as dialogs } from "./dialogs";
import { pages as frames } from "./frames";
import { pages as keyboard } from "./keyboard";
import { pages as content } from "./content";
import { pages as network } from "./network";
import { pages as debugging } from "./debugging";

export const registry: Record<string, PageModule> = {
  ...basic,
  ...locators,
  ...dynamic,
  ...forms,
  ...auth,
  ...tables,
  ...dialogs,
  ...frames,
  ...keyboard,
  ...content,
  ...network,
  ...debugging,
};
