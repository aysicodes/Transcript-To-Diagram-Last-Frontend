// src/services/apiRequest.js
export const apiRequest = async (url, method = "GET", body = null) => {
    const token = localStorage.getItem("token");
    const headers = {
      "Content-Type": "application/json",
      Authorization: token ? `Bearer ${token}` : "", // Добавляем токен
    };
  
    const options = {
      method,
      headers,
    };
  
    if (body) {
      options.body = JSON.stringify(body);
    }
  
    try {
      const response = await fetch(url, options);
      const responseData = await response.json();
  
      if (!response.ok) {
        throw new Error(responseData.message || "Something went wrong");
      }
  
      return responseData;
    } catch (error) {
      console.error("API request failed:", error);
      throw error;
    }
  };
  