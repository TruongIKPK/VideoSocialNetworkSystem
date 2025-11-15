// Validators
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePassword = (password: string): boolean => {
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const isLongEnough = password.length >= 8;
  return hasUpperCase && hasLowerCase && hasNumbers && isLongEnough;
};

// Types
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  fullName: string;
  email: string;
  password: string;
}

export interface User {
  _id: string;
  name: string;
  username: string;
  email: string;
  bio: string;
  avatar: string;
  followers: number;
  followersList: string[];
  following: number;
  followingList: string[];
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  token?: string;
  user?: User;
}

export interface ValidationErrors {
  [key: string]: string;
}

// Validation Functions
export const validateLoginForm = (
  email: string,
  password: string
): ValidationErrors => {
  const errors: ValidationErrors = {};

  if (!email.trim()) {
    errors.email = "Email không được để trống";
  } else if (!validateEmail(email)) {
    errors.email = "Email không hợp lệ";
  }

  if (!password.trim()) {
    errors.password = "Mật khẩu không được để trống";
  } else if (password.length < 5) {
    errors.password = "Mật khẩu phải có ít nhất 5 ký tự";
  }

  return errors;
};

export const validateRegisterForm = (
  fullName: string,
  email: string,
  password: string,
  confirmPassword: string,
  agreeTerms: boolean
): ValidationErrors => {
  const errors: ValidationErrors = {};

  // Validate Full Name
  if (!fullName.trim()) {
    errors.fullName = "Họ và tên không được để trống";
  } else if (fullName.trim().length < 3) {
    errors.fullName = "Họ và tên phải có ít nhất 3 ký tự";
  }

  // Validate Email
  if (!email.trim()) {
    errors.email = "Email không được để trống";
  } else if (!validateEmail(email)) {
    errors.email = "Email không hợp lệ";
  }

  // Validate Password
  if (!password.trim()) {
    errors.password = "Mật khẩu không được để trống";
  } else if (password.length < 5) {
    errors.password = "Mật khẩu phải có ít nhất 5 ký tự";
  }

  // Validate Confirm Password
  if (!confirmPassword.trim()) {
    errors.confirmPassword = "Xác nhận mật khẩu không được để trống";
  } else if (password !== confirmPassword) {
    errors.confirmPassword = "Mật khẩu xác nhận không trùng khớp";
  }

  // Validate Terms
  if (!agreeTerms) {
    errors.terms = "Bạn phải đồng ý với điều khoản sử dụng";
  }

  return errors;
};

// API Service
export const authService = {
  API_BASE_URL: "https://videosocialnetworksystem.onrender.com/api",

  /**
   * Đăng nhập
   */
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      const response = await fetch(`${this.API_BASE_URL}/users/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: credentials.email,
          password: credentials.password,
        }),
      });

      const data = await response.json();

      if (response.status === 200) {
        return {
          success: true,
          message: "Đăng nhập thành công",
          user: data,
        };
      } else {
        return {
          success: false,
          message: data.message || "Đăng nhập thất bại",
        };
      }
    } catch (error) {
      console.error("Login error:", error);
      return {
        success: false,
        message: "Không thể kết nối đến máy chủ. Vui lòng thử lại!",
      };
    }
  },

  /**
   * Đăng kí
   */
  async register(credentials: RegisterCredentials): Promise<AuthResponse> {
    try {
      const response = await fetch(`${this.API_BASE_URL}/users/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: credentials.fullName,
          username: credentials.fullName,
          email: credentials.email,
          password: credentials.password,
        }),
      });

      const data = await response.json();

      if (response.status === 201) {
        return {
          success: true,
          message: "Đăng kí tài khoản thành công! Vui lòng đăng nhập.",
          user: data,
        };
      } else if (response.status === 400) {
        return {
          success: false,
          message: data.message || "Email đã được sử dụng",
        };
      } else {
        return {
          success: false,
          message: data.message || "Đăng kí thất bại",
        };
      }
    } catch (error) {
      console.error("Register error:", error);
      return {
        success: false,
        message: "Không thể kết nối đến máy chủ. Vui lòng thử lại!",
      };
    }
  },

  /**
   * Đăng xuất
   */
  async logout(): Promise<void> {
    try {
      // TODO: Clear token từ storage khi có
      console.log("Logged out");
    } catch (error) {
      console.error("Logout error:", error);
    }
  },
};

export default authService;
