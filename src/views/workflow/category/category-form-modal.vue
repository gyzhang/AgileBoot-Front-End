<script setup lang="ts">
import VDialog from "@/components/VDialog/VDialog.vue";
import { computed, reactive, ref } from "vue";
import {
  AddCategoryCommand,
  UpdateCategoryCommand,
  CategoryPageResponse,
  addCategoryApi,
  updateCategoryApi
} from "@/api/workflow/category";
import { useUserStoreHook } from "@/store/modules/user";
import { ElMessage, FormInstance, FormRules } from "element-plus";

interface Props {
  type: "add" | "update";
  modelValue: boolean;
  row?: CategoryPageResponse;
}

const props = defineProps<Props>();
const emits = defineEmits<{
  (e: "update:modelValue", v: boolean): void;
  (e: "success"): void;
}>();

const visible = computed({
  get: () => props.modelValue,
  set(v) {
    emits("update:modelValue", v);
  }
});

const formData = reactive<AddCategoryCommand | UpdateCategoryCommand>({
  categoryId: 0,
  categoryCode: "",
  categoryName: "",
  categorySort: 0,
  status: 0,
  remark: ""
});

const statusList = useUserStoreHook().dictionaryMap["common.status"];

const rules: FormRules = {};
const formRef = ref<FormInstance>();
function handleOpened() {
  if (props.row) {
    Object.assign(formData, props.row);
  } else {
    formRef.value?.resetFields();
  }
}

const loading = ref(false);
async function handleConfirm() {
  try {
    loading.value = true;
    if (props.type === "add") {
      await addCategoryApi(formData);
    } else if (props.type === "update") {
      await updateCategoryApi(formData as UpdateCategoryCommand);
    }
    ElMessage.info("提交成功");
    visible.value = false;
    emits("success");
  } catch (e) {
    console.error(e);
    ElMessage.error((e as Error)?.message || "提交失败");
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <v-dialog
    show-full-screen
    :fixed-body-height="false"
    use-body-scrolling
    :title="type === 'add' ? '新增流程分类' : '修改流程分类'"
    v-model="visible"
    :loading="loading"
    @confirm="handleConfirm"
    @cancel="visible = false"
    @opened="handleOpened"
  >
    <el-form :model="formData" label-width="120px" :rules="rules" ref="formRef">
      <el-form-item label="分类编码" prop="categoryCode">
        <el-input
          v-model="formData.categoryCode"
          placeholder="分类编码"
          :disabled="type === 'update'"
        />
      </el-form-item>
      <el-form-item label="分类名称" prop="categoryName">
        <el-input v-model="formData.categoryName" placeholder="分类名称" />
      </el-form-item>
      <el-form-item label="显示顺序" prop="categorySort">
        <el-input-number :min="1" v-model="formData.categorySort" />
      </el-form-item>
      <el-form-item label="状态" prop="status">
        <el-radio-group v-model="formData.status">
          <el-radio
            v-for="item in Object.keys(statusList)"
            :key="item"
            :label="statusList[item].value"
            >{{ statusList[item].label }}</el-radio
          >
        </el-radio-group>
      </el-form-item>
      <el-form-item label="备注" prop="remark">
        <el-input
          type="textarea"
          v-model="formData.remark"
          placeholder="备注"
        />
      </el-form-item>
    </el-form>
  </v-dialog>
</template>
