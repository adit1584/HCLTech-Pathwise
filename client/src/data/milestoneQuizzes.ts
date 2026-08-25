export interface QuizQuestion {
  id: number;
  question: string;
  codeSnippet?: string;
  type: 'code_snippet' | 'knowledge';
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  options: string[];
  correctAnswer: number; // 0-indexed
  explanation: string;
}

export interface MilestoneQuiz {
  skillId: string;
  topicTitle: string;
  passingScorePercent: number; // e.g., 70%
  questions: QuizQuestion[];
}

export const MILESTONE_QUIZZES: Record<string, MilestoneQuiz> = {
  // ── SQL Assessment (12 Questions: 4 Easy, 4 Medium, 4 Hard) ────────────
  sql: {
    skillId: 'sql',
    topicTitle: 'SQL & Relational Databases',
    passingScorePercent: 70,
    questions: [
      // 1-4 Easy
      {
        id: 1,
        question: 'Which SQL clause is used to filter rows returned by a SELECT statement?',
        type: 'knowledge',
        difficulty: 'EASY',
        options: ['GROUP BY', 'HAVING', 'WHERE', 'ORDER BY'],
        correctAnswer: 2,
        explanation: 'The WHERE clause filters individual rows before any grouping or aggregation occurs.',
      },
      {
        id: 2,
        question: 'What is the output of the following SQL query?',
        codeSnippet: 'SELECT COUNT(*) FROM users WHERE email IS NULL;',
        type: 'code_snippet',
        difficulty: 'EASY',
        options: [
          'Returns the total number of rows in the users table',
          'Returns the count of users with missing or unassigned email addresses',
          'Returns a syntax error because IS NULL cannot be used with COUNT(*)',
          'Returns 0 if any user has an email',
        ],
        correctAnswer: 1,
        explanation: 'WHERE email IS NULL filters rows where the email field is null, and COUNT(*) counts those matching rows.',
      },
      {
        id: 3,
        question: 'Which JOIN returns all records from the left table and matched records from the right table?',
        type: 'knowledge',
        difficulty: 'EASY',
        options: ['INNER JOIN', 'RIGHT JOIN', 'LEFT JOIN', 'FULL OUTER JOIN'],
        correctAnswer: 2,
        explanation: 'LEFT JOIN returns all records from the left table and matched values from the right table, with NULLs for unmatched right rows.',
      },
      {
        id: 4,
        question: 'What does DISTINCT do in the following query?',
        codeSnippet: 'SELECT DISTINCT country FROM customers;',
        type: 'code_snippet',
        difficulty: 'EASY',
        options: [
          'Sorts countries in descending alphabetical order',
          'Eliminates duplicate country values and returns only unique countries',
          'Counts how many customers belong to each country',
          'Filters out NULL countries only',
        ],
        correctAnswer: 1,
        explanation: 'DISTINCT removes duplicate rows from the query result set.',
      },

      // 5-8 Medium
      {
        id: 5,
        question: 'What is the fundamental difference between WHERE and HAVING in SQL?',
        type: 'knowledge',
        difficulty: 'MEDIUM',
        options: [
          'WHERE is faster than HAVING for string operations',
          'WHERE filters rows before aggregation; HAVING filters aggregated groups after GROUP BY',
          'HAVING can only be used with subqueries',
          'WHERE requires an index while HAVING does not',
        ],
        correctAnswer: 1,
        explanation: 'WHERE filters individual row records prior to grouping. HAVING filters groups produced by GROUP BY and aggregate functions.',
      },
      {
        id: 6,
        question: 'What does this query calculate?',
        codeSnippet: `SELECT department_id, AVG(salary) as avg_sal
FROM employees
GROUP BY department_id
HAVING AVG(salary) > 80000;`,
        type: 'code_snippet',
        difficulty: 'MEDIUM',
        options: [
          'All employees earning more than $80,000',
          'Departments whose average employee salary exceeds $80,000',
          'The highest earning department',
          'Average salary of the first 80,000 employees',
        ],
        correctAnswer: 1,
        explanation: 'GROUP BY aggregates by department_id, and HAVING AVG(salary) > 80000 filters for departments whose average exceeds 80,000.',
      },
      {
        id: 7,
        question: 'Which index type is best suited for equality lookups on high-cardinality primary keys in PostgreSQL/MySQL?',
        type: 'knowledge',
        difficulty: 'MEDIUM',
        options: ['B-Tree Index', 'GIN Index', 'BRIN Index', 'GiST Index'],
        correctAnswer: 0,
        explanation: 'B-Tree is the default and most efficient general-purpose index for equality (=) and range (<, >, BETWEEN) lookups on sorted keys.',
      },
      {
        id: 8,
        question: 'What is the result of evaluating this expression in SQL?',
        codeSnippet: 'SELECT 10 + NULL, COALESCE(NULL, 0, 5);',
        type: 'code_snippet',
        difficulty: 'MEDIUM',
        options: [
          '10 and NULL',
          'NULL and 0',
          '10 and 5',
          '0 and 0',
        ],
        correctAnswer: 1,
        explanation: 'Any arithmetic with NULL produces NULL (10 + NULL = NULL). COALESCE returns the first non-null argument, which is 0.',
      },

      // 9-12 Hard
      {
        id: 9,
        question: 'What does the DENSE_RANK() window function return when two rows tie for 2nd place?',
        codeSnippet: `SELECT name, salary,
       DENSE_RANK() OVER (ORDER BY salary DESC) as rank
FROM employees;`,
        type: 'code_snippet',
        difficulty: 'HARD',
        options: [
          'Tied rows get 2, and the next row gets 4 (skips 3)',
          'Tied rows get 2, and the next row gets 3 (no gap in sequence)',
          'Tied rows get unique floating point ranks',
          'Throws an exception unless a secondary tie-breaker column is provided',
        ],
        correctAnswer: 1,
        explanation: 'Unlike RANK() which leaves gaps (1, 2, 2, 4), DENSE_RANK() leaves no gaps in ranking values (1, 2, 2, 3).',
      },
      {
        id: 10,
        question: 'What problem does this Common Table Expression (CTE) query solve?',
        codeSnippet: `WITH RankedSalaries AS (
  SELECT emp_id, department_id, salary,
         ROW_NUMBER() OVER(PARTITION BY department_id ORDER BY salary DESC) as rn
  FROM employees
)
SELECT * FROM RankedSalaries WHERE rn = 1;`,
        type: 'code_snippet',
        difficulty: 'HARD',
        options: [
          'Calculates overall company salary median',
          'Finds the single highest paid employee within each department',
          'Deletes duplicate employee entries',
          'Aggregates department budgets',
        ],
        correctAnswer: 1,
        explanation: 'PARTITION BY department_id groups by department, and ORDER BY salary DESC with rn = 1 extracts the top earner per department.',
      },
      {
        id: 11,
        question: 'In ACID transaction properties, what anomaly does the "Serializable" isolation level prevent that "Repeatable Read" may permit?',
        type: 'knowledge',
        difficulty: 'HARD',
        options: [
          'Dirty Reads',
          'Non-repeatable Reads',
          'Phantom Reads and Write Skew',
          'Syntax compilation errors',
        ],
        correctAnswer: 2,
        explanation: 'Serializable is the strictest isolation level; it prevents Write Skew and Phantom anomalies by ensuring concurrent transactions execute as if strictly serial.',
      },
      {
        id: 12,
        question: 'What happens when evaluating this correlated subquery with an EXISTS clause?',
        codeSnippet: `SELECT c.customer_id
FROM customers c
WHERE NOT EXISTS (
  SELECT 1 FROM orders o WHERE o.customer_id = c.customer_id
);`,
        type: 'code_snippet',
        difficulty: 'HARD',
        options: [
          'Returns customers who have placed at least 1 order',
          'Returns customers who have never placed any order, stopping scan as soon as first order match is found',
          'Executes a full cartesian product table scan',
          'Fails because SELECT 1 is invalid syntax',
        ],
        correctAnswer: 1,
        explanation: 'NOT EXISTS tests for the non-existence of any rows in the subquery. The engine optimizes SELECT 1 by short-circuiting on the first matching record.',
      },
    ],
  },

  // ── Python Assessment (12 Questions: 4 Easy, 4 Medium, 4 Hard) ──────────
  python: {
    skillId: 'python',
    topicTitle: 'Python Core & Algorithms',
    passingScorePercent: 70,
    questions: [
      // 1-4 Easy
      {
        id: 1,
        question: 'What is the output of the following Python snippet?',
        codeSnippet: `x = [1, 2, 3]
y = x
y.append(4)
print(len(x))`,
        type: 'code_snippet',
        difficulty: 'EASY',
        options: ['3', '4', 'TypeError', 'IndexError'],
        correctAnswer: 1,
        explanation: 'In Python, lists are mutable references. Assigning y = x binds y to the exact same list object in memory, so modifying y modifies x.',
      },
      {
        id: 2,
        question: 'Which built-in Python data structure guarantees O(1) average time complexity for key lookups?',
        type: 'knowledge',
        difficulty: 'EASY',
        options: ['List', 'Tuple', 'Dictionary (dict)', 'Linked List'],
        correctAnswer: 2,
        explanation: 'Python dictionaries are implemented as hash tables, providing average O(1) time complexity for key lookups, insertions, and deletions.',
      },
      {
        id: 3,
        question: 'What does the range(2, 10, 3) expression produce?',
        type: 'knowledge',
        difficulty: 'EASY',
        options: ['[2, 5, 8]', '[2, 3, 4, 5, 6, 7, 8, 9, 10]', '[3, 6, 9]', '[2, 4, 6, 8, 10]'],
        correctAnswer: 0,
        explanation: 'range(start, stop, step) starts at 2, steps by 3, and stops before 10 -> 2, 5, 8.',
      },
      {
        id: 4,
        question: 'What will print when running this slice?',
        codeSnippet: `text = "Pathwise"
print(text[::-1])`,
        type: 'code_snippet',
        difficulty: 'EASY',
        options: ['Pathwise', 'esiwhtaP', 'P', 'IndexError'],
        correctAnswer: 1,
        explanation: '[::-1] is the Pythonic slicing idiom for reversing a sequence.',
      },

      // 5-8 Medium
      {
        id: 5,
        question: 'What is the output of this list comprehension with conditional filter?',
        codeSnippet: `nums = [1, 2, 3, 4, 5, 6]
res = [x**2 for x in nums if x % 2 == 0]
print(res)`,
        type: 'code_snippet',
        difficulty: 'MEDIUM',
        options: ['[1, 9, 25]', '[4, 16, 36]', '[2, 4, 6]', '[1, 4, 9, 16, 25, 36]'],
        correctAnswer: 1,
        explanation: 'The list comprehension filters for even numbers (2, 4, 6) and squares them -> [4, 16, 36].',
      },
      {
        id: 6,
        question: 'What is the difference between `is` and `==` in Python?',
        type: 'knowledge',
        difficulty: 'MEDIUM',
        options: [
          '== checks reference identity; is checks value equality',
          'is checks reference identity (memory address); == checks value equality',
          'is is only used for strings; == is for numbers',
          'There is no difference in Python 3',
        ],
        correctAnswer: 1,
        explanation: '`is` verifies whether two variables point to the same object in memory (`id(a) == id(b)`), while `==` checks value equality (`a.__eq__(b)`).',
      },
      {
        id: 7,
        question: 'What does this generator function yield?',
        codeSnippet: `def gen():
    yield 1
    yield 2
    return 3

g = gen()
print(next(g), next(g))`,
        type: 'code_snippet',
        difficulty: 'MEDIUM',
        options: ['1 2', '1 3', '2 3', 'StopIteration error on first call'],
        correctAnswer: 0,
        explanation: 'Calling next(g) twice yields 1 then 2. The return 3 value is only accessible via the StopIteration exception value upon exhausting the generator.',
      },
      {
        id: 8,
        question: 'What is the main purpose of Python `*args` and `**kwargs` in function signatures?',
        type: 'knowledge',
        difficulty: 'MEDIUM',
        options: [
          'To declare private class methods',
          'To accept arbitrary numbers of positional (*args as tuple) and keyword (**kwargs as dict) arguments',
          'To enforce strict type annotations at runtime',
          'To allocate memory pointers directly',
        ],
        correctAnswer: 1,
        explanation: '*args captures extra positional arguments as a tuple, and **kwargs captures extra keyword arguments as a dictionary.',
      },

      // 9-12 Hard
      {
        id: 9,
        question: 'What will be printed by this decorator execution?',
        codeSnippet: `def my_decorator(func):
    def wrapper(*args, **kwargs):
        return func(*args, **kwargs) * 2
    return wrapper

@my_decorator
def calculate(a, b):
    return a + b

print(calculate(3, 4))`,
        type: 'code_snippet',
        difficulty: 'HARD',
        options: ['7', '14', 'TypeError', 'None'],
        correctAnswer: 1,
        explanation: 'calculate(3, 4) executes wrapper(3, 4), which computes func(3, 4) = 7, then multiplies by 2 -> 14.',
      },
      {
        id: 10,
        question: 'What unexpected behavior occurs with mutable default arguments in Python?',
        codeSnippet: `def add_item(item, target_list=[]):
    target_list.append(item)
    return target_list

print(add_item('a'))
print(add_item('b'))`,
        type: 'code_snippet',
        difficulty: 'HARD',
        options: [
          "['a'] then ['b']",
          "['a'] then ['a', 'b']",
          "['a', 'b'] then ['a', 'b']",
          'Throws DefaultArgumentError',
        ],
        correctAnswer: 1,
        explanation: 'Default argument expressions in Python are evaluated once at function definition time, so target_list is shared across all subsequent invocations.',
      },
      {
        id: 11,
        question: 'What is Python Global Interpreter Lock (GIL) and its direct impact on multi-threading?',
        type: 'knowledge',
        difficulty: 'HARD',
        options: [
          'A lock that prevents memory leaks by freezing variables',
          'A mutex that allows only one native thread to execute Python bytecode at a time, limiting CPU-bound speedup across multi-core CPUs',
          'A security firewall that blocks unauthorized network sockets',
          'An async/await runtime optimizer',
        ],
        correctAnswer: 1,
        explanation: 'The GIL prevents true multi-core parallel execution of CPU-bound Python bytecode within a single process. CPU parallelism requires multiprocessing.',
      },
      {
        id: 12,
        question: 'What will this context manager implementation output?',
        codeSnippet: `class ScopeGuard:
    def __enter__(self):
        print("IN", end=" ")
        return self
    def __exit__(self, exc_type, exc_val, exc_tb):
        print("OUT")

with ScopeGuard():
    print("BODY", end=" ")`,
        type: 'code_snippet',
        difficulty: 'HARD',
        options: [
          'IN BODY OUT',
          'BODY IN OUT',
          'IN OUT BODY',
          'SyntaxError',
        ],
        correctAnswer: 0,
        explanation: '__enter__ is called before the with-block, the block body executes, and __exit__ executes upon leaving the block scope -> "IN BODY OUT".',
      },
    ],
  },

  // ── JavaScript / React Assessment ────────────────────────────────────────
  javascript: {
    skillId: 'javascript',
    topicTitle: 'JavaScript & Asynchronous Programming',
    passingScorePercent: 70,
    questions: [
      // 1-4 Easy
      {
        id: 1,
        question: 'Which keyword declares a block-scoped variable that can be reassigned?',
        type: 'knowledge',
        difficulty: 'EASY',
        options: ['var', 'const', 'let', 'static'],
        correctAnswer: 2,
        explanation: 'let is block-scoped and allows reassignment, whereas const cannot be reassigned and var is function-scoped.',
      },
      {
        id: 2,
        question: 'What is the output of the following JavaScript snippet?',
        codeSnippet: `console.log(typeof null, typeof undefined);`,
        type: 'code_snippet',
        difficulty: 'EASY',
        options: ['"null" "undefined"', '"object" "undefined"', '"undefined" "undefined"', '"object" "object"'],
        correctAnswer: 1,
        explanation: 'typeof null is famously "object" due to legacy ECMAScript representation, while typeof undefined is "undefined".',
      },
      {
        id: 3,
        question: 'What does the Array.prototype.map() method return?',
        type: 'knowledge',
        difficulty: 'EASY',
        options: [
          'Mutates original array in-place',
          'A new array containing results of calling provided function on every element',
          'The first element matching condition',
          'A boolean flag',
        ],
        correctAnswer: 1,
        explanation: 'map creates a brand new array populated with the results of calling a provided callback function on every element in the calling array.',
      },
      {
        id: 4,
        question: 'What is the value of result?',
        codeSnippet: `const nums = [1, 2, 3];
const result = nums.reduce((acc, curr) => acc + curr, 10);`,
        type: 'code_snippet',
        difficulty: 'EASY',
        options: ['6', '16', '10', 'NaN'],
        correctAnswer: 1,
        explanation: 'Initial value is 10. Adding 1 + 2 + 3 gives 10 + 6 = 16.',
      },

      // 5-8 Medium
      {
        id: 5,
        question: 'What is the console output order of the JavaScript Event Loop?',
        codeSnippet: `console.log('1');
setTimeout(() => console.log('2'), 0);
Promise.resolve().then(() => console.log('3'));
console.log('4');`,
        type: 'code_snippet',
        difficulty: 'MEDIUM',
        options: ['1, 2, 3, 4', '1, 4, 3, 2', '1, 4, 2, 3', '4, 1, 3, 2'],
        correctAnswer: 1,
        explanation: 'Synchronous tasks run first (1, 4). Microtasks (Promise.then -> 3) run before Macrotasks (setTimeout -> 2). Result: 1, 4, 3, 2.',
      },
      {
        id: 6,
        question: 'What does the `this` keyword refer to inside an arrow function?',
        type: 'knowledge',
        difficulty: 'MEDIUM',
        options: [
          'The object that invoked the function',
          'The global window/globalThis object always',
          'Lexical `this` inherited from enclosing scope at time of definition',
          'undefined in strict mode',
        ],
        correctAnswer: 2,
        explanation: 'Arrow functions do not bind their own `this`; they retain the `this` value of the enclosing lexical execution context.',
      },
      {
        id: 7,
        question: 'What will print from this closure snippet?',
        codeSnippet: `function makeCounter() {
    let count = 0;
    return () => ++count;
}
const c1 = makeCounter();
const c2 = makeCounter();
c1(); c1();
console.log(c1(), c2());`,
        type: 'code_snippet',
        difficulty: 'MEDIUM',
        options: ['3 1', '3 3', '2 1', 'NaN NaN'],
        correctAnswer: 0,
        explanation: 'c1 and c2 maintain separate closure lexical environments. c1 is called 3 times -> 3. c2 is called 1 time -> 1.',
      },
      {
        id: 8,
        question: 'What is the purpose of Promise.allSettled() compared to Promise.all()?',
        type: 'knowledge',
        difficulty: 'MEDIUM',
        options: [
          'allSettled rejects immediately on first failure',
          'allSettled waits for all promises to either fulfill or reject and returns an array of status objects without short-circuiting',
          'allSettled is synchronous',
          'allSettled only handles HTTP fetch requests',
        ],
        correctAnswer: 1,
        explanation: 'Promise.allSettled() never short-circuits on rejection; it returns status ("fulfilled"/"rejected") and value/reason for every promise.',
      },

      // 9-12 Hard
      {
        id: 9,
        question: 'What will be logged by this async generator & for-await loop?',
        codeSnippet: `async function* stream() {
    yield await Promise.resolve(10);
    yield await Promise.resolve(20);
}
(async () => {
    let total = 0;
    for await (const val of stream()) total += val;
    console.log(total);
})();`,
        type: 'code_snippet',
        difficulty: 'HARD',
        options: ['30', '1020', '0', 'Promise { <pending> }'],
        correctAnswer: 0,
        explanation: 'for await iterates over the async generator, resolving each yield (10 then 20) and summing them -> 30.',
      },
      {
        id: 10,
        question: 'What is the role of the WeakMap data structure in JavaScript memory management?',
        type: 'knowledge',
        difficulty: 'HARD',
        options: [
          'Keys must be objects, and values are held weakly without blocking garbage collection when key objects are dereferenced',
          'Keys are strings with weak type coercion',
          'It is an array that auto-clears after 100ms',
          'It replaces localStorage',
        ],
        correctAnswer: 0,
        explanation: 'WeakMap keys must be objects. Keys are weakly referenced, allowing them to be garbage collected when no other references exist, preventing memory leaks.',
      },
      {
        id: 11,
        question: 'What does this JavaScript Proxy trap intercept?',
        codeSnippet: `const target = { secret: 42 };
const proxy = new Proxy(target, {
    get(obj, prop) {
        return prop in obj ? obj[prop] * 2 : 'NOT_FOUND';
    }
});
console.log(proxy.secret, proxy.other);`,
        type: 'code_snippet',
        difficulty: 'HARD',
        options: ['84 NOT_FOUND', '42 NOT_FOUND', '42 undefined', 'TypeError'],
        correctAnswer: 0,
        explanation: 'The get trap intercepts property access. "secret" in obj is true -> 42 * 2 = 84. "other" in obj is false -> "NOT_FOUND".',
      },
      {
        id: 12,
        question: 'How does the JavaScript V8 engine optimize hot functions via hidden classes (Shapes) and Inline Caching (IC)?',
        type: 'knowledge',
        difficulty: 'HARD',
        options: [
          'By compiling all variables to 64-bit integers',
          'Objects initialized with identical property keys in the exact same order share Hidden Classes, allowing monomorphic IC fast property offset lookups',
          'By eliminating garbage collection pauses completely',
          'By running multiple V8 threads on the callstack',
        ],
        correctAnswer: 1,
        explanation: 'V8 assigns Hidden Classes (Shapes) based on property insertion order. Consistent shapes allow Monomorphic Inline Caching to bypass hash lookups with direct memory offset reads.',
      },
    ],
  },

  // ── Machine Learning Assessment ──────────────────────────────────────────
  'machine-learning': {
    skillId: 'machine-learning',
    topicTitle: 'Machine Learning & Predictive Modeling',
    passingScorePercent: 70,
    questions: [
      // 1-4 Easy
      {
        id: 1,
        question: 'Which of the following is a Supervised Learning task?',
        type: 'knowledge',
        difficulty: 'EASY',
        options: [
          'K-Means Clustering',
          'Predicting housing prices from historical sale records with known target prices',
          'PCA Dimensionality Reduction',
          'Anomaly detection on unlabeled server logs',
        ],
        correctAnswer: 1,
        explanation: 'Supervised learning uses labeled training data where each input sample has a known ground truth target value.',
      },
      {
        id: 2,
        question: 'What does this Scikit-Learn code snippet do?',
        codeSnippet: `from sklearn.model_selection import train_test_split
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)`,
        type: 'code_snippet',
        difficulty: 'EASY',
        options: [
          'Trains a Random Forest classifier on 20% of data',
          'Splits dataset into 80% training set and 20% validation test set with reproducible random seed',
          'Normalizes features between 0 and 1',
          'Removes outlier rows',
        ],
        correctAnswer: 1,
        explanation: 'train_test_split divides features and labels into training and evaluation sets.',
      },
      {
        id: 3,
        question: 'Which metric is best for evaluating a model on an imbalanced classification dataset (e.g. 99% negative, 1% fraud)?',
        type: 'knowledge',
        difficulty: 'EASY',
        options: ['Accuracy', 'F1-Score / PR-AUC', 'Mean Absolute Error', 'R-Squared'],
        correctAnswer: 1,
        explanation: 'On imbalanced data, accuracy is misleading (a naive model predicting 0 gets 99% accuracy). F1-Score or Precision-Recall AUC evaluates minority class performance.',
      },
      {
        id: 4,
        question: 'What is overfitting in machine learning?',
        type: 'knowledge',
        difficulty: 'EASY',
        options: [
          'Model performs poorly on both training and test data',
          'Model performs exceptionally well on training data but fails to generalize to unseen test data',
          'Model trains too quickly',
          'Dataset has too few features',
        ],
        correctAnswer: 1,
        explanation: 'Overfitting occurs when a model learns noise and specific details of the training set rather than the underlying general pattern.',
      },

      // 5-8 Medium
      {
        id: 5,
        question: 'What does L1 Regularization (Lasso) do to model weights compared to L2 Regularization (Ridge)?',
        type: 'knowledge',
        difficulty: 'MEDIUM',
        options: [
          'L1 drives non-informative feature weights strictly to zero (sparse feature selection); L2 shrinks weights toward zero without forcing exact zero',
          'L1 squares weights; L2 takes absolute values',
          'L1 is only for neural networks',
          'L2 cannot prevent overfitting',
        ],
        correctAnswer: 0,
        explanation: 'L1 regularization penalty (|w|) produces sparse weight vectors by zeroing out coefficients, performing automatic feature selection.',
      },
      {
        id: 6,
        question: 'What does this cross-validation code evaluate?',
        codeSnippet: `from sklearn.model_selection import cross_val_score
scores = cross_val_score(model, X, y, cv=5, scoring='roc_auc')
print(scores.mean())`,
        type: 'code_snippet',
        difficulty: 'MEDIUM',
        options: [
          'Trains 5 different algorithms simultaneously',
          'Performs 5-Fold Cross Validation and computes the mean ROC-AUC score across all 5 test folds',
          'Splits data into 50% training and 50% test',
          'Plots the ROC curve',
        ],
        correctAnswer: 1,
        explanation: 'cross_val_score splits data into 5 stratified folds, trains on 4, validates on 1, and repeats 5 times, computing the average ROC-AUC metric.',
      },
      {
        id: 7,
        question: 'In Decision Trees, what criterion measures the impurity or disorder of a node split in classification?',
        type: 'knowledge',
        difficulty: 'MEDIUM',
        options: ['Gini Impurity or Shannon Entropy', 'Mean Squared Error', 'Euclidean Distance', 'Cosine Similarity'],
        correctAnswer: 0,
        explanation: 'Gini Impurity and Entropy are the standard criteria used by CART and C4.5 decision tree algorithms to select the optimal feature threshold split.',
      },
      {
        id: 8,
        question: 'What is the primary difference between Bagging (e.g. Random Forest) and Boosting (e.g. XGBoost, Gradient Boosting)?',
        type: 'knowledge',
        difficulty: 'MEDIUM',
        options: [
          'Bagging trains trees in parallel on bootstrap samples to reduce variance; Boosting trains trees sequentially where each tree corrects errors of predecessors to reduce bias',
          'Bagging is only for regression; Boosting is only for classification',
          'Boosting does not use decision trees',
          'Bagging requires GPU acceleration',
        ],
        correctAnswer: 0,
        explanation: 'Bagging averages independent models to reduce variance. Boosting fits sequential models to pseudo-residuals of previous models to reduce bias.',
      },

      // 9-12 Hard
      {
        id: 9,
        question: 'What mathematical loss function is minimized in binary logistic regression?',
        type: 'knowledge',
        difficulty: 'HARD',
        options: [
          'Binary Cross-Entropy / Log Loss (-[y*log(p) + (1-y)*log(1-p)])',
          'Mean Squared Error (MSE)',
          'Hinge Loss',
          'Kullback-Leibler Divergence only',
        ],
        correctAnswer: 0,
        explanation: 'Binary Cross-Entropy (Log Loss) derived from Maximum Likelihood Estimation is the standard convex loss function for logistic regression classification.',
      },
      {
        id: 10,
        question: 'What does this Scikit-Learn Pipeline prevent during data preprocessing?',
        codeSnippet: `from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.linear_model import LogisticRegression

pipe = Pipeline([
    ('scaler', StandardScaler()),
    ('clf', LogisticRegression())
])
pipe.fit(X_train, y_train)`,
        type: 'code_snippet',
        difficulty: 'HARD',
        options: [
          'Prevents data leakage by fitting the scaler strictly on X_train and transforming validation folds during cross-validation',
          'Speeds up GPU training by 10x',
          'Automatically removes null values',
          'Eliminates the need for hyperparameters',
        ],
        correctAnswer: 0,
        explanation: 'Pipelines encapsulate feature transformations and estimators, preventing data snooping / data leakage from test data into training preprocessing.',
      },
      {
        id: 11,
        question: 'What is the Bias-Variance Tradeoff in statistical learning?',
        type: 'knowledge',
        difficulty: 'HARD',
        options: [
          'Bias is training time; Variance is inference memory',
          'High bias leads to underfitting (oversimplified model); High variance leads to overfitting (high sensitivity to training sample fluctuations)',
          'Bias and variance always increase together',
          'Variance is only present in deep learning models',
        ],
        correctAnswer: 1,
        explanation: 'Total expected test error = Bias^2 + Variance + Irreducible Error. Balancing model complexity minimizes total validation error.',
      },
      {
        id: 12,
        question: 'What does SHAP (SHapley Additive exPlanations) compute for machine learning model interpretability?',
        type: 'knowledge',
        difficulty: 'HARD',
        options: [
          'A simple correlation matrix between all features',
          'Game-theoretic Shapley values quantifying the fair marginal contribution of each feature to an individual prediction relative to baseline',
          'The learning rate decay schedule',
          'The accuracy percentage of each decision tree leaf',
        ],
        correctAnswer: 1,
        explanation: 'SHAP calculates Shapley values from cooperative game theory to explain the exact marginal push (positive or negative) each feature value contributed to a specific model output.',
      },
    ],
  },
};

// Enhanced quiz resolver for skills, titles, and milestone indices
export function getQuizForSkill(skillId: string, title?: string): MilestoneQuiz {
  const normalized = (skillId || '').toLowerCase().trim();
  const titleNorm = (title || '').toLowerCase().trim();

  // 1. Direct match in quiz catalog
  if (MILESTONE_QUIZZES[normalized]) {
    return MILESTONE_QUIZZES[normalized];
  }

  // 2. Check key substring in skillId or title
  for (const [key, quiz] of Object.entries(MILESTONE_QUIZZES)) {
    if (normalized.includes(key) || key.includes(normalized) || titleNorm.includes(key)) {
      return quiz;
    }
  }

  // 3. Keyword associations
  if (titleNorm.includes('sql') || titleNorm.includes('database') || titleNorm.includes('postgres') || titleNorm.includes('query') || titleNorm.includes('relational')) {
    return MILESTONE_QUIZZES.sql;
  }
  if (titleNorm.includes('python') || titleNorm.includes('algorithm') || titleNorm.includes('script') || titleNorm.includes('data structure') || titleNorm.includes('backend logic')) {
    return MILESTONE_QUIZZES.python;
  }
  if (titleNorm.includes('learn') || titleNorm.includes('model') || titleNorm.includes('regress') || titleNorm.includes('classif') || titleNorm.includes('ai') || titleNorm.includes('feature')) {
    return MILESTONE_QUIZZES['machine-learning'] || MILESTONE_QUIZZES.python;
  }
  if (titleNorm.includes('javascript') || titleNorm.includes('js') || titleNorm.includes('node') || titleNorm.includes('express') || titleNorm.includes('react') || titleNorm.includes('front')) {
    return MILESTONE_QUIZZES.javascript || MILESTONE_QUIZZES.react;
  }
  if (titleNorm.includes('docker') || titleNorm.includes('container') || titleNorm.includes('deploy') || titleNorm.includes('devops') || titleNorm.includes('cloud')) {
    return MILESTONE_QUIZZES.docker || MILESTONE_QUIZZES.python;
  }
  if (titleNorm.includes('clean') || titleNorm.includes('pandas') || titleNorm.includes('eda') || titleNorm.includes('analysis')) {
    return MILESTONE_QUIZZES['data-cleaning'] || MILESTONE_QUIZZES.python;
  }

  // 4. Milestone index mapping
  if (titleNorm.includes('milestone 1') || normalized.includes('milestone-1')) {
    return MILESTONE_QUIZZES.sql;
  }
  if (titleNorm.includes('milestone 2') || normalized.includes('milestone-2')) {
    return MILESTONE_QUIZZES.python;
  }
  if (titleNorm.includes('milestone 3') || normalized.includes('milestone-3')) {
    return MILESTONE_QUIZZES['machine-learning'] || MILESTONE_QUIZZES.javascript;
  }
  if (titleNorm.includes('milestone 4') || normalized.includes('milestone-4')) {
    return MILESTONE_QUIZZES.react || MILESTONE_QUIZZES.docker;
  }

  // Default to rich SQL quiz
  return MILESTONE_QUIZZES.sql;
}

