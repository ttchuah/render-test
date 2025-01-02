import { getOrganizations, saveOrganization, deleteAllOrganizations, deleteOrganization, updateOrganization } from "./organizationController";
import { Router } from "express";
import { checkToken } from "../../middleware";
import { catchErrors } from "../../utils/catchErrors";

export const routes = Router();
routes.get("/organization", checkToken, getOrganizations);
routes.post('/organization', checkToken, catchErrors(saveOrganization));
routes.delete('/organization/all', checkToken, catchErrors(deleteAllOrganizations));
routes.delete('/organization/:id', checkToken, catchErrors(deleteOrganization))
routes.post('/organization/:id', checkToken, catchErrors(updateOrganization));