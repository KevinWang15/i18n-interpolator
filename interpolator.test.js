import {describe, it} from "mocha";
import assert from "assert";
import Interpolator from "./interpolator.js";

function testInterpolator() {
    const tests = [
        {
            name: "no i18n",
            input: `abc`,
            expected: "abc",
            translations: {},
        },
        {
            name: "simple",
            input: `>> \${i18n("TEST")} <<`,
            translations: {
                "TEST": "translated TEST",
            },
            expected: ">> translated TEST <<",
        },
        {
            name: "two calls",
            input: `>> \${i18n("TEST1")} -- \${i18n("TEST2")} <<`,
            translations: {
                "TEST1": "translated TEST1",
                "TEST2": "translated TEST2",
            },
            expected: ">> translated TEST1 -- translated TEST2 <<",
        },
        {
            name: "with variables",
            input: `>> \${i18n("TEST", {a: -1, b: 1.23, c: false, d: "d"})} <<`,
            translations: {
                "TEST": "a is ${a}, b is ${b}, c is ${c}, d is ${d}",
            },
            expected: ">> a is -1, b is 1.23, c is false, d is d <<",
        },
        {
            name: "with variables advanced",
            input: `> \${i18n("TEST", {a: {b: [1, 2, 3]}})} <`,
            translations: {
                "TEST": "-- ${a.b[2]} --",
            },
            expected: "> -- 3 -- <",
        },
        {
            name: "with variables - nested parsing",
            input: `>> \${i18n("TEST", {
                a: 1,
                b: {c: "xx \${i18n(\\\"TEST2\\\")} yy", d: [1, "xx \${i18n(\\\"TEST3\\\")} yy", 2]}
            })} <<`,
            translations: {
                "TEST": "TEST, a=${a}, b=${b}",
                "TEST2": "this is TEST2..",
                "TEST3": "this is TEST3..",
            },
            expected: ">> TEST, a=1, b={c: xx this is TEST2.. yy, d: [1, xx this is TEST3.. yy, 2]} <<",
        },
        {
            name: "complex",
            input: `>> \${i18n("TEST", {a:"\${i18n(1)}\\\""})} <<`,
            translations: {
                "TEST": "TEST, a=${a}",
            },
            expected: ">> TEST, a=${i18n(1)}\" <<",
        },
        {
            name: "complex2",
            input: `>> \${i18n("TEST", {a: "1)}\\\"", b: "nested \${i18n(\\\"TEST2\\\", {a:\\\"2\\\"})}"})} <<`,
            translations: {
                "TEST": "TEST, a=${a} b=${b}",
                "TEST2": "this is TEST2.., a=${a}",
            },
            expected: ">> TEST, a=1)}\" b=nested this is TEST2.., a=2 <<",
        },
        {
            name: "missing variable in translation",
            input: `>> \${i18n("TEST", {a: 1})} <<`,
            translations: {
                "TEST": "TEST, a=${a} b=${b}",
            },
            expected: ">> TEST, a=1 b=${b} <<",
        },
        {
            name: "missing translation template",
            input: `>> \${i18n("TEST", {a: 1})} <<`,
            translations: {},
            expected: ">> TEST <<",
        },
        {
            name: "missing translation template 2",
            input: `>> \${i18n("你好 \${a}", {a:1})} <<`,
            translations: {},
            expected: ">> 你好 1 <<",
        },
        {
            name: "invalid translation template",
            input: `>> \${i18n("TEST", {a: 1})} <<`,
            translations: {
                "TEST": "TEST, a=${a",
            },
            expected: ">> TEST, a=${a <<",
        },
    ];

    for (const test of tests) {
        it(test.name, () => {
            const result = new Interpolator({default: test.translations}).interpolate(test.input);
            assert.strictEqual(result, test.expected);
        });
    }
}

describe('Interpolator', testInterpolator);
