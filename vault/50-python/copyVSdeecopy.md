
------------------------------
## title: Shallow Copy vs. Deep Copy in Python
type: note
tags: [python, programming, memory-management, data-structures]
status: learning
sources: []## Summary
In Python, assignment statements do not copy objects; they merely bind a reference to them. To create actual copies, Python provides the copy module, which distinguishes between shallow copies (copy.copy()) and deep copies (copy.deepcopy()). Understanding this distinction is critical for preventing unintended side effects when manipulating nested data structures like lists of lists or complex dictionaries.
## Key Points

* Shallow Copy (copy.copy()):
* Constructs a new collection object.
   * Populates it with references to the child objects found in the original.
   * Consequence: Modifying a mutable nested element in the copied object will simultaneously alter the original object.
* Deep Copy (copy.deepcopy()):
* Constructs a new collection object recursively.
   * Populates it with brand-new copies of the child objects found in the original.
   * Consequence: The new object becomes entirely independent of the original. Modifications to any nested layer have zero cross-impact.
* Performance Trade-offs:
* Shallow Copy: Highly efficient; runs quickly and uses minimal extra memory because it copies pointers rather than data.
   * Deep Copy: Slower and memory-intensive; traverses the entire object tree to replicate every single layer in memory.

## Links

* Essential for ensuring data isolation before sending mutable payloads into [[Model Pipelines]].
* Frequently used during hyperparameter optimization loops to duplicate base configurations before training variations.

## References
Python Software Foundation. (2026). copy — Shallow and deep copy operations. Python Documentation. python.org
If you would like to expand this note, tell me if you want to include:

* Code snippets for custom class objects using __copy__() and __deepcopy__()
* A section on immutable objects (like tuples) and how Python handles them during copies


