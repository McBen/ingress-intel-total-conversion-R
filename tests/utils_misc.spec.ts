import { convertTextToTableMagic, digits } from "../core/code/helper/utils_misc";

describe("utils_misc", () => {

    it("digits should insert spaces", () => {

        expect(digits(1)).toBe("1");
        expect(digits(123)).toBe("123");
        expect(digits(1000)).toBe("1 000");
        expect(digits("number 1234")).toBe("number 1 234");
        expect(digits(1234567890)).toBe("1 234 567 890");
    })


    it("convertTextToTableMagic should build a table", () => {

        // no table
        expect(convertTextToTableMagic("noop")).toBe("noop");

        // 1 row
        const table1 = convertTextToTableMagic("1\t2");
        const table1Str = "<table>" +
            "<tr><td>1</td><td>2</td></tr>" +
            "</table>";
        expect(table1).toBe(table1Str);

        // 2 rows
        const table2 = convertTextToTableMagic("1\t2\n3\t4");
        const table2Str = "<table>" +
            "<tr><td>1</td><td>2</td></tr>" +
            "<tr><td>3</td><td>4</td></tr>" +
            "</table>";
        expect(table2).toBe(table2Str);
    });

    it("should have jquery", () => {
        expect($("body")).toBeDefined();
    })

})

