import axios from "axios";

export const getBoards = async () => {
    const response = await axios.get("http://localhost:8081/boards");
    console.log(response.data);
    return response.data;
};