import * as SecureStore from "expo-secure-store";

const TOKEN_KEY = "auth_token";

/**
 * Lưu token vào secure store
 * @param token - Token cần lưu
 * @returns Promise<boolean> - true nếu lưu thành công, false nếu có lỗi
 */
export const saveToken = async (token: string): Promise<boolean> => {
  try {
    await SecureStore.setItemAsync(TOKEN_KEY, token);
    return true;
  } catch (error) {
    console.error("Lỗi khi lưu token:", error);
    return false;
  }
};

/**
 * Lấy token từ secure store
 * @returns Promise<string | null> - Token nếu tồn tại, null nếu không có hoặc có lỗi
 */
export const getToken = async (): Promise<string | null> => {
  try {
    const token = await SecureStore.getItemAsync(TOKEN_KEY);
    return token;
  } catch (error) {
      console.error("Lỗi khi lấy token:", error);
      return null;
  }
};

/**
 * Xóa token khỏi secure store
 * @returns Promise<boolean> - true nếu xóa thành công, false nếu có lỗi
 */
export const removeToken = async (): Promise<boolean> => {
  try {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    return true;
  } catch (error) {
    console.error("Lỗi khi xóa token:", error);
    return false;
  }
};

/**
 * Kiểm tra token có tồn tại không
 * @returns Promise<boolean> - true nếu token tồn tại, false nếu không
 */
export const hasToken = async (): Promise<boolean> => {
  try {
    const token = await SecureStore.getItemAsync(TOKEN_KEY);
    return token !== null;
  } catch (error) {
    console.error("Lỗi khi kiểm tra token:", error);
    return false;
  }
};

