var wordPattern = function(pattern, s) {
    let map = new Map();
    let patternCounter = 0;
    let string = "";
    for (let i = 0; i < s.length; i++) {
        if (s[i] !== " ") {
            string += s[i];
        } else {
            let result = map.get(pattern[patternCounter]);
            console.log(result);
            if (result !== undefined && result !== string) {
                return false;
            }
            map.set(pattern[patternCounter++], string);
            string = "";
        }
    }
    return true;
};
wordPattern("abba", "dog cat cat fish");