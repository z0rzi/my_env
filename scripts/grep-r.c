#include <stdio.h> 
#include <stdlib.h> 
#include <string.h>
#include <dirent.h> 
#include <time.h>
#include <sys/stat.h>

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
                    && strcmp(ext, ".html")
                    && strcmp(ext, ".jsx")
                    && strcmp(ext, ".scss")
                    && strcmp(ext, ".css")
                    && strcmp(ext, ".c")
                    && strcmp(ext, ".json")
                    && strcmp(ext, ".xml")
                ) {
                    break;
                }

                char c[1];
                FILE *fptr;
                if ((fptr = fopen(newPath, "r")) == NULL)
                    break;

                cnt = 10000;
                int searchIdx = 0;
                int lineCnt = 1;
                int colCnt = 1;
                char line[200];
                while (fscanf(fptr, "%c", c) != EOF && cnt--) {
                    if (c[0] == '\n') {
                        lineCnt++;
                        colCnt=1;
                        continue;
                    }
                    if (c[0] == search[searchIdx]) {
                        searchIdx++;
                        if (searchIdx > 0 && search[searchIdx] == '\0') {
                            if (colCnt < 200) line[colCnt - 1] = c[0];
                            colCnt++;
                            while (fscanf(fptr, "%c", c) != EOF && c[0] != '\n') {
                                if (colCnt < 200) line[colCnt - 1] = c[0];
                                colCnt++;
                            }
                            if (colCnt < 200)
                                line[colCnt - 1] = '\0';
                            printf("%s:%d:%d: %s\n", newPath, lineCnt, colCnt, line);

                            searchIdx = 0;
                            lineCnt++;
                            colCnt=1;
                            continue;
                        }
                    } else {
                        searchIdx = 0;
                    }
                    if (colCnt < 200) line[colCnt - 1] = c[0];
                    colCnt++;
                }
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
