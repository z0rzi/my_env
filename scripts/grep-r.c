#include <stdio.h> 
#include <stdlib.h> 
#include <string.h>
#include <dirent.h> 
#include <time.h>
#include <sys/stat.h>

#define LINE_LIMIT_LENGTH 200

typedef struct MatchPosStruct {
    char* str;
    int strPos;
    char* rx;
} MatchPos;

short isNum(char cara) {
    return cara >= '0' && cara <= '9';
}

short isAlpha(char cara) {
    return (cara >= 'a' && cara <= 'z')
        || (cara >= 'A' && cara <= 'Z')
        || cara == '_';
}

short isAlnum(char cara) {
    return isAlpha(cara) || isNum(cara);
}

short matches(MatchPos* mp) {
    int rxPos = 0;
    int strPos = mp->strPos;
    short ok = 0;

    while (mp->rx[rxPos] != '\0') {
        if (mp->rx[rxPos] == '\\') {
            rxPos++;
            switch (mp->rx[rxPos]) {
                case 'b':
                    strPos--;
                    ok = (isAlnum(mp->str[strPos]) && !isAlnum(mp->str[strPos + 1]))
                        || (!isAlnum(mp->str[strPos]) && isAlnum(mp->str[strPos + 1]));
                    break;
                case 'd':
                    ok = isNum(mp->str[strPos]);
                    break;
                case '\\':
                    ok = (mp->str[strPos] == '\\');
                    break;
                default:
                    ok = (mp->str[strPos] == '\\');
                    rxPos--;
            }
        } else {
            ok = (mp->str[strPos] == mp->rx[rxPos]);
        }

        if (!ok) return 0;
        strPos++;
        rxPos++;
    }

    return 1;
}

void dir_contents(char* path, char* search) {
    DIR *dr = opendir(path); 

    struct dirent *de;  // Pointer for directory entry 
    struct stat b;
    int idx = 0;

    while ((de = readdir(dr)) != NULL)  {
        char newPath[300];
        strcpy(newPath, path);
        strcat(newPath, "/");
        strcat(newPath, de->d_name);

        stat(newPath, &b);

        switch (de->d_type) {
            case DT_REG:
                {}
                int cnt = strlen(newPath) - 1;
                while (--cnt && newPath[cnt] != '.');

                if ((strlen(newPath) - cnt) > 10)
                    break;

                char ext[10];

                strcpy(ext, newPath + cnt);

                if (strcmp(ext, ".ts")
                    && strcmp(ext, ".tsx")
                    && strcmp(ext, ".js")
                    && strcmp(ext, ".jsx")
                    && strcmp(ext, ".py")
                    && strcmp(ext, ".html")
                    && strcmp(ext, ".scss")
                    && strcmp(ext, ".css")
                    && strcmp(ext, ".c")
                    && strcmp(ext, ".json")
                    && strcmp(ext, ".xml")
                ) {
                    break;
                }

                char c;
                FILE *fptr;
                if ((fptr = fopen(newPath, "r")) == NULL)
                    break;


                MatchPos mp;

                mp.str = (char*) malloc(LINE_LIMIT_LENGTH * sizeof(char));

                mp.rx = search;
                cnt = 100000;
                int lineCnt = 0;
                int strLenLimit = 0;
                while (fscanf(fptr, "%c", &c) != EOF && cnt--) {
                    lineCnt++;
                    mp.strPos = 0;
                    while (c != '\n' && c != EOF) {
                        mp.str[mp.strPos] = c;
                        mp.strPos++;
                        fscanf(fptr, "%c", &c);
                        if (mp.strPos >= LINE_LIMIT_LENGTH)
                            break;
                    }
                    if (mp.strPos == 0) continue;
                    strLenLimit = mp.strPos;
                    mp.str[mp.strPos - 1] = '\0';
                    mp.strPos = 0;

                    while (++mp.strPos <= strLenLimit)
                    if (matches(&mp)) {
                        /* printf("%s\n", mp.str); */
                        printf("%s:%d:%d: %s\n", newPath, lineCnt, mp.strPos, mp.str);
                    }
                    /*     if (search[mp.rxPos + 1] == '\0') { */
                    /*         if (mp.strPos < 200) mp.str[mp.strPos - 1] = c[0]; */
                    /*         mp.strPos++; */
                    /*         while (fscanf(fptr, "%c", c) != EOF && c[0] != '\n') { */
                    /*             if (mp.strPos < 200) mp.str[mp.strPos - 1] = c[0]; */
                    /*             mp.strPos++; */
                    /*         } */
                    /*         if (mp.strPos < 200) */
                    /*             mp.str[mp.strPos - 1] = '\0'; */
                    /*         printf("%s:%d:%d: %s\n", newPath, lineCnt, mp.strPos, mp.str); */

                    /*         mp.rxPos = 0; */
                    /*         lineCnt++; */
                    /*         mp.strPos=1; */
                    /*         continue; */
                    /*     } */
                    /*     mp.rxPos++; */
                    /* } else { */
                    /*     mp.rxPos = 0; */
                    /* } */
                    /* if (mp.strPos < 200) mp.str[mp.strPos - 1] = c[0]; */
                    /* mp.strPos++; */
                }
                free(mp.str);
                fclose(fptr);

                break;
            case DT_DIR:
                if (
                    strcmp(de->d_name, ".")
                    && strcmp(de->d_name, "..")
                    && strcmp(de->d_name, "node_modules")
                    && strcmp(de->d_name, "target")
                    && strcmp(de->d_name, "__pycache__")
                    && strcmp(de->d_name, "cache")
                    && strcmp(de->d_name, "build")
                    && strcmp(de->d_name, "coverage")
                    && strcmp(de->d_name, "dist")
                    && strcmp(de->d_name, ".git")
                    && strcmp(de->d_name, ".npm")
                    && strcmp(de->d_name, ".kube")
                    && strcmp(de->d_name, ".cache")
                ) {
                    dir_contents(newPath, search);
                }
                break;
        }
    }
    closedir(dr);     
    return;
}

void printNotice() {
    printf("\n");
    printf("grep-r, used to.. find text.. Yeah\n");
    printf("\n");
    printf("  grep-r [path1 path2 search path3 ...] [--no-sort]\n");
    printf("\n");
    printf("    paths:     Just paths, relative or absolute\n");
    printf("    search:    The text you're looking for\n");
    printf("    --no-sort: Disable sorting of the files by modification time, improve performances\n");
    printf("    --help:    Prints this\n");
    printf("\n");
}

int main(int argc, char** argv) 
{ 
    _Bool should_sort = 1;

    void* paths[10];
    void* search;
    int pathsIdx = 0;
    for (int i=1 ; i<argc ; i++) {
        if (argv[i][0] == '-' && argv[i][1] == '-') {
            if (!strcmp(argv[i], "--help")) {
                printNotice();
                return 0;
            } else if (!strcmp(argv[i], "--no-sort")) {
                should_sort = 0;
            }
            continue;
        }
        DIR *dr = opendir(argv[i]);
        if (dr == NULL) {
            search = argv[i];
        } else {
            paths[pathsIdx] = argv[i];
            pathsIdx++;
        }
    }

    if (search == NULL) {
        printNotice();
        return 1;
    }

    if (pathsIdx == 0) {
        dir_contents(".", (char*)search);
    } else {
        while (pathsIdx--) {
            dir_contents(paths[pathsIdx], (char*)search);
        }
    }

    return 0; 
} 
