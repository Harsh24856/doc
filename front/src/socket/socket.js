import { io } from "socket.io-client";
import API_BASE_URL from "../config/api.js";

const socket = io(API_BASE_URL, {
  auth: {
    token: localStorage.getItem("token"),
  },
  autoConnect: true,
});

export default socket;