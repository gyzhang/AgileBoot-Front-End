import { http } from "@/utils/http";

export interface CategoryListCommand extends BasePageQuery {
  categoryCode?: string;
  categoryName?: string;
  status?: number;
  createTime?: string;
}

export interface CategoryPageResponse {
  categoryId: number;
  categoryCode: string;
  categoryName: string;
  categorySort: number;
  status: number;
  remark: string;
}

export function getCategoryListApi(params: CategoryListCommand) {
  return http.request<ResponseData<PageDTO<CategoryPageResponse>>>(
    "get",
    "/workflow/category/list",
    {
      params
    }
  );
}

export const exportCategoryExcelApi = (
  params: CategoryListCommand,
  fileName: string
) => {
  return http.download("/workflow/category/excel", fileName, {
    params
  });
};

export const deleteCategoryApi = (data: Array<number>) => {
  return http.request<ResponseData<void>>("delete", "/workflow/category", {
    params: {
      ids: data.toString()
    }
  });
};

export interface AddCategoryCommand {
  categoryCode: string;
  categoryName: string;
  categorySort: number;
  status: number;
  remark: string;
}

export const addCategoryApi = (data: AddCategoryCommand) => {
  return http.request<ResponseData<void>>("post", "/workflow/category", {
    data
  });
};

export interface UpdateCategoryCommand extends AddCategoryCommand {
  categoryId: number;
}

export const updateCategoryApi = (data: UpdateCategoryCommand) => {
  return http.request<ResponseData<void>>("put", "/workflow/category", {
    data
  });
};
