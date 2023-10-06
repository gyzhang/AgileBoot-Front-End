import dayjs from "dayjs";
import { message } from "@/utils/message";
import { ElMessageBox, Sort } from "element-plus";
import { reactive, ref, onMounted, toRaw, computed } from "vue";
import { useUserStoreHook } from "@/store/modules/user";
import { CommonUtils } from "@/utils/common";
import { PaginationProps } from "@pureadmin/table";
import {
  PostListCommand,
  getPostListApi,
  exportPostExcelApi,
  deletePostApi
} from "@/api/system/post";

const statusMap = useUserStoreHook().dictionaryMap["common.status"];

export function usePostHook() {
  const defaultSort: Sort = {
    prop: "postSort",
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

  const searchFormParams = reactive<PostListCommand>({
    postCode: "",
    postName: "",
    status: undefined
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
      label: "岗位编号",
      prop: "postId",
      minWidth: 100
    },
    {
      label: "岗位编码",
      prop: "postCode",
      minWidth: 120
    },
    {
      label: "岗位名称",
      prop: "postName",
      minWidth: 120
    },
    {
      label: "岗位排序",
      prop: "postSort",
      sortable: "custom",
      minWidth: 120
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
      label: "创建时间",
      minWidth: 160,
      prop: "createTime",
      sortable: "custom",
      formatter: ({ createTime }) =>
        dayjs(createTime).format("YYYY-MM-DD HH:mm:ss")
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
    getPostList();
  }

  async function onSearch(tableRef) {
    tableRef.getTableRef().sort("postSort", "ascending");
  }

  function resetForm(formEl, tableRef) {
    if (!formEl) return;
    formEl.resetFields();
    searchFormParams.beginTime = undefined;
    searchFormParams.endTime = undefined;
    onSearch(tableRef);
  }

  async function getPostList() {
    pageLoading.value = true;
    CommonUtils.fillSortParams(searchFormParams, sortState.value);
    CommonUtils.fillPaginationParams(searchFormParams, pagination);

    const { data } = await getPostListApi(toRaw(searchFormParams)).finally(
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

    exportPostExcelApi(toRaw(searchFormParams), "岗位列表(全部).xlsx");
  }

  async function handleDelete(row) {
    await deletePostApi([row.postId]).then(() => {
      message(`您删除了编号为${row.postId}的这条岗位数据`, {
        type: "success"
      });
      getPostList();
    });
  }

  async function handleBulkDelete(tableRef) {
    if (multipleSelection.value.length === 0) {
      message("请选择需要删除的数据", { type: "warning" });
      return;
    }

    ElMessageBox.confirm(
      `确认要<strong style='color:var(--el-color-danger)'>删除</strong>编号为<strong style='color:var(--el-color-primary)'>[ ${multipleSelection.value} ]</strong>的岗位数据吗?`,
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
        await deletePostApi(multipleSelection.value).then(() => {
          message(`您删除了编号为[ ${multipleSelection.value} ]的岗位数据`, {
            type: "success"
          });
          // 刷新列表
          getPostList();
        });
      })
      .catch(() => {
        message("取消删除", {
          type: "info"
        });
        tableRef.getTableRef().clearSelection();
      });
  }

  onMounted(getPostList);

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
    getPostList,
    resetForm,
    handleDelete,
    handleBulkDelete
  };
}
