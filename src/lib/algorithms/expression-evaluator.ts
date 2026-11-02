import {
  create,
  all,
  type FunctionNode,
  type MathNode,
  type SymbolNode,
} from "mathjs";

const math = create(all);
const MAX_EXPRESSION_LENGTH = 500;
const MAX_AST_NODES = 100;
const ALLOWED_CONSTANTS = new Set(["e", "pi", "x"]);
const ALLOWED_FUNCTIONS = new Set([
  "abs",
  "acos",
  "acosh",
  "asin",
  "asinh",
  "atan",
  "atan2",
  "atanh",
  "ceil",
  "cos",
  "cosh",
  "exp",
  "floor",
  "log",
  "log10",
  "max",
  "min",
  "pow",
  "round",
  "sin",
  "sinh",
  "sqrt",
  "tan",
  "tanh",
]);

function normalizeExpression(source: string): string {
  return source
    .replace(/\bMath\.(\w+)/g, "$1")
    .replace(/\*\*/g, "^")
    .replace(/(\d|\))\s*x\b/g, "$1 * x")
    .replace(/(\d|x|\))\s*(?=\()/g, "$1 * ")
    .replace(/(\))\s*(?=\d)/g, "$1 * ");
}

function validateNode(node: MathNode): void {
  let nodeCount = 0;
  node.traverse((child) => {
    nodeCount++;
    if (nodeCount > MAX_AST_NODES) {
      throw new Error("Biểu thức vượt quá giới hạn độ phức tạp.");
    }

    if (
      child.type === "AssignmentNode" ||
      child.type === "FunctionAssignmentNode" ||
      child.type === "BlockNode" ||
      child.type === "AccessorNode" ||
      child.type === "ObjectNode" ||
      child.type === "ArrayNode"
    ) {
      throw new Error("Biểu thức chứa cú pháp không được phép.");
    }

    if (child.type === "SymbolNode") {
      const name = (child as SymbolNode).name;
      if (!ALLOWED_CONSTANTS.has(name) && !ALLOWED_FUNCTIONS.has(name)) {
        throw new Error(`Ký hiệu không được phép: "${name}".`);
      }
    }

    if (child.type === "FunctionNode") {
      const fn = (child as FunctionNode).fn;
      const functionName = fn && "name" in fn ? fn.name : undefined;
      if (!functionName || !ALLOWED_FUNCTIONS.has(functionName)) {
        throw new Error("Hàm trong biểu thức không được phép.");
      }
    }
  });
}

/**
 * Biên dịch đạo hàm cấp `order` của f(x) (đạo hàm ký hiệu bằng mathjs).
 * Trả về hàm số và dạng LaTeX của f^{(order)}(x).
 */
export function compileDerivative(
  source: string,
  order: number,
): { fn: (x: number) => number; tex: string } {
  if (typeof source !== "string" || source.trim().length === 0) {
    throw new Error("Biểu thức không được để trống.");
  }
  if (source.length > MAX_EXPRESSION_LENGTH) {
    throw new Error(`Biểu thức không được dài quá ${MAX_EXPRESSION_LENGTH} ký tự.`);
  }
  if (!Number.isInteger(order) || order < 1 || order > 12) {
    throw new Error("Cấp đạo hàm phải là số nguyên trong khoảng 1..12.");
  }

  const node = math.parse(normalizeExpression(source));
  validateNode(node);

  let derived: MathNode = node;
  for (let i = 0; i < order; i++) {
    derived = math.derivative(derived, "x");
  }
  const compiled = derived.compile();

  return {
    fn: (x: number) => {
      const value = compiled.evaluate({ x });
      if (typeof value !== "number" || !Number.isFinite(value)) {
        throw new Error("Đạo hàm không trả về một số hữu hạn trên đoạn khảo sát.");
      }
      return value;
    },
    tex: derived.toTex(),
  };
}

export function compileExpression(source: string): (x: number) => number {
  if (typeof source !== "string" || source.trim().length === 0) {
    throw new Error("Biểu thức không được để trống.");
  }
  if (source.length > MAX_EXPRESSION_LENGTH) {
    throw new Error(`Biểu thức không được dài quá ${MAX_EXPRESSION_LENGTH} ký tự.`);
  }

  const node = math.parse(normalizeExpression(source));
  validateNode(node);
  const compiled = node.compile();

  return (x: number) => {
    const value = compiled.evaluate({ x });
    if (typeof value !== "number" || !Number.isFinite(value)) {
      throw new Error("Biểu thức không trả về một số hữu hạn.");
    }
    return value;
  };
}
