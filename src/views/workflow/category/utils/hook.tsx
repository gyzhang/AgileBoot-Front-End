import dayjs from "dayjs";
import { message } from "@/utils/message";
import { ElMessageBox, Sort } from "element-plus";
import { reactive, ref, onMounted, toRaw, computed } from "vue";
import { useUserStoreHook } from "@/store/modules/user";
import { CommonUtils } from "@/utils/common";
import { PaginationProps } from "@pureadmin/table";
import {
  CategoryListCommand,
  getCategoryListApi,
  exportCategoryExcelApi,
  deleteCategoryApi
} from "@/api/workflow/category";

const statusMap = useUserStoreHook().dictionaryMap["common.status"];

export function useCategoryHook() {
  const defaultSort: Sort = {
    prop: "categorySort",
    order: "ascending"
  };

  const pagination: PaginationProps = {
    total: 0,
    pageSize: 10,
    currentPage: 1,
    background: true
  };

  const timeRange = computed<[string, string] | null>({
    get() {
      if (searchFormParams.beginTime && searchFormParams.endTime) {
        return [searchFormParams.beginTime, searchFormParams.endTime];
      } else {
        return null;
      }
    },
    set(v) {
      if (v?.length === 2) {
        searchFormParams.beginTime = v[0];
        searchFormParams.endTime = v[1];
      } else {
        searchFormParams.beginTime = undefined;
        searchFormParams.endTime = undefined;
      }
    }
  });

  const searchFormParams = reactive<CategoryListCommand>({
    categoryCode: "",
    categoryName: "",
    status: undefined,
    createTime: ""
  });

  const dataList = ref([]);
  const pageLoading = ref(true);
  const multipleSelection = ref([]);
  const sortState = ref<Sort>(defaultSort);

  const columns: TableColumnList = [
    {
      type: "selection",
      align: "left"
    },
    {
      label: "分类编码",
      prop: "categoryCode",
      sortable: "custom",
      minWidth: 100
    },
    {
      label: "分类名称",
      prop: "categoryName",
      minWidth: 100
    },
    {
      label: "显示顺序",
      prop: "categorySort",
      sortable: "custom",
      minWidth: 100
    },
    {
      label: "状态",
      prop: "status",
      minWidth: 120,
      cellRenderer: ({ row, props }) => (
        <el-tag
          size={props.size}
          type={statusMap[row.status].cssTag}
          effect="plain"
        >
          {statusMap[row.status].label}
        </el-tag>
      )
    },
    {
      label: "备注",
      prop: "remark",
      minWidth: 100
    },
    {
      label: "创建日期",
      minWidth: 160,
      prop: "createTime",
      sortable: "custom",
      formatter: ({ createTime }) => dayjs(createTime).format("YYYY-MM-DD")
    },
    {
      label: "操作",
      fixed: "right",
      width: 140,
      slot: "operation"
    }
  ];

  function onSortChanged(sort: Sort) {
    sortState.value = sort;
    pagination.currentPage = 1;
    getCategoryList();
  }

  async function onSearch(tableRef) {
    tableRef.getTableRef().sort("categorySort", "ascending");
  }

  function resetForm(formEl, tableRef) {
    if (!formEl) return;
    formEl.resetFields();
    searchFormParams.beginTime = undefined;
    searchFormParams.endTime = undefined;
    onSearch(tableRef);
  }

  async function getCategoryList() {
    pageLoading.value = true;
    CommonUtils.fillSortParams(searchFormParams, sortState.value);
    CommonUtils.fillPaginationParams(searchFormParams, pagination);

    const { data } = await getCategoryListApi(toRaw(searchFormParams)).finally(
      () => {
        pageLoading.value = false;
      }
    );
    dataList.value = data.rows;
    pagination.total = data.total;
  }

  async function exportAllExcel() {
    if (sortState.value != null) {
      CommonUtils.fillSortParams(searchFormParams, sortState.value);
    }
    CommonUtils.fillPaginationParams(searchFormParams, pagination);
    CommonUtils.fillTimeRangeParams(searchFormParams, timeRange.value);

    exportCategoryExcelApi(toRaw(searchFormParams), "流程分类列表(全部).xlsx");
  }

  async function handleDelete(row) {
    await deleteCategoryApi([row.categoryId]).then(() => {
      message(`您删除了编码为${row.categoryCode}的这条流程分类数据`, {
        type: "success"
      });
      getCategoryList();
    });
  }

  async function handleBulkDelete(tableRef) {
    if (multipleSelection.value.length === 0) {
      message("请选择需要删除的数据", { type: "warning" });
      return;
    }

    ElMessageBox.confirm(
      `确认要<strong style='color:var(--el-color-danger)'>删除</strong>编号为<strong style='color:var(--el-color-primary)'>[ ${multipleSelection.value} ]</strong>的流程分类数据吗?`,
      "系统提示",
      {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "warning",
        dangerouslyUseHTMLString: true,
        draggable: true
      }
    )
      .then(async () => {
        await deleteCategoryApi(multipleSelection.value).then(() => {
          message(
            `您删除了编号为[ ${multipleSelection.value} ]的流程分类数据`,
            {
              type: "success"
            }
          );
          getCategoryList();
        });
      })
      .catch(() => {
        message("取消删除", {
          type: "info"
        });
        tableRef.getTableRef().clearSelection();
      });
  }

  onMounted(getCategoryList);

  return {
    searchFormParams,
    pageLoading,
    columns,
    dataList,
    pagination,
    defaultSort,
    timeRange,
    multipleSelection,
    onSearch,
    onSortChanged,
    exportAllExcel,
    getCategoryList,
    resetForm,
    handleDelete,
    handleBulkDelete
  };
}
