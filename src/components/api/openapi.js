import todolistYaml from "./todolist-openapi.yaml";
import YAML from "json2yaml";

let apiSpec = "";

let todolistSpec = YAML.stringify(todolistYaml);
apiSpec += todolistSpec;


export default apiSpec;