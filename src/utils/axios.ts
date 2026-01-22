/**
 * axios setup to use mock service
 */

import axios from "axios";

const axiosServices = axios.create();

// interceptor for http
axiosServices.interceptors.response.use(
  (response) => response,
  (error) =>
    Promise.reject((error.response && error.response.data) || "Target service has some problem")
);

export default axiosServices;
