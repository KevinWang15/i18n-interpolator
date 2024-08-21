import JSON5 from "json5";

const i18nFunctionCallRegex = /\${i18n\("([^"]*)\s*"/;

export default class Interpolator {
    constructor(translations) {
        this.translations = translations;
        this.language = "default";
    }

    setLanguage(language) {
        if (!this.translations[language]) {
            this.language = "default";
        } else {
            this.language = language;
        }
        return this;
    }

    interpolate(input) {
        if (typeof input === "string") {
            return this.interpolateString(input);
        } else if (Array.isArray(input)) {
            return input.map((v) => this.interpolate(v));
        } else if (typeof input === "object" && input !== null) {
            const result = {};
            for (const [k, v] of Object.entries(input)) {
                result[k] = this.interpolate(v);
            }
            return result;
        }
        return input;
    }

    interpolateString(input) {
        let result = "";

        while (input.length > 0) {
            const match = i18nFunctionCallRegex.exec(input);

            if (match === null) {
                result += input;
                input = "";
                break;
            }

            result += input.slice(0, match.index);
            input = input.slice(match.index + match[0].length);

            const translationKey = match[1];

            if (input.startsWith(")}")) {
                result += this.getTranslation(translationKey, null);
                input = input.slice(2);
                continue;
            }

            if (input[0] === ",") {
                input = input.slice(1);
            }

            let inQuotes = false;
            let parenthesisLevel = 1;
            for (let i = 0; i < input.length; i++) {
                if (input[i] === "\\" && i + 1 < input.length && input[i + 1] === '"') {
                    i++;
                    continue;
                }

                if (input[i] === '"') {
                    inQuotes = !inQuotes;
                }

                if (!inQuotes && input[i] === "(") {
                    parenthesisLevel++;
                }

                if (!inQuotes && input[i] === ")") {
                    parenthesisLevel--;
                }

                if (!inQuotes && parenthesisLevel === 0 && input.slice(i, i + 2) === ")}") {
                    const variablesJson = input.slice(0, i);
                    const variables = JSON5.parse(variablesJson);
                    const interpolatedVariables = this.interpolate(variables);

                    result += this.getTranslation(translationKey, interpolatedVariables);
                    input = input.slice(i + 2);
                    break;
                }
            }
        }

        return result;
    }

    getTranslation(translationKey, variables) {
        let value = this.translations?.[this.language]?.[translationKey] || translationKey;
        let result = "";

        while (true) {
            const start = value.indexOf("${");
            if (start === -1) {
                result += value;
                break;
            }

            result += value.slice(0, start);
            value = value.slice(start + 2);

            const end = value.indexOf("}");
            if (end === -1) {
                result += "${";
                result += value;
                break;
            }

            const path = value.slice(0, end);
            value = value.slice(end + 1);

            let interpolatedValue = undefined;

            try {
                interpolatedValue = this.getValueByPath(variables, path);
            } catch {
            }
            if (interpolatedValue !== undefined) {
                result += this.formatValue(interpolatedValue);
            } else {
                result += `\${${path}}`;
            }
        }

        return result;
    }

    getValueByPath(data, path) {
        const parts = path.split(".");
        let value = data;

        for (const part of parts) {
            if (part.includes("[") && part.includes("]")) {
                const [arrayName, indexStr] = part.split("[");
                const index = parseInt(indexStr.slice(0, -1), 10);

                if (isNaN(index)) {
                    throw new Error(`invalid array index: ${indexStr}`);
                }

                const arrayValue = value[arrayName];
                if (!Array.isArray(arrayValue)) {
                    throw new Error(`value is not an array: ${arrayName}`);
                }

                if (index < 0 || index >= arrayValue.length) {
                    throw new Error(`array index out of range: ${index}`);
                }

                value = arrayValue[index];
            } else {
                if (typeof value !== "object" || value === null) {
                    throw new Error("value is not an object");
                }

                if (!(part in value)) {
                    throw new Error(`key not found: ${part}`);
                }

                value = value[part];
            }
        }

        return value;
    }

    formatValue(value) {
        if (typeof value === "string") {
            return value;
        } else if (typeof value === "number") {
            return value.toString();
        } else if (typeof value === "boolean") {
            return value.toString();
        } else if (Array.isArray(value)) {
            const elements = value.map((element) => this.formatValue(element));
            return `[${elements.join(", ")}]`;
        } else if (typeof value === "object" && value !== null) {
            const pairs = Object.entries(value).map(
                ([key, val]) => `${key}: ${this.formatValue(val)}`
            );
            pairs.sort();
            return `{${pairs.join(", ")}}`;
        } else {
            return String(value);
        }
    }
}
