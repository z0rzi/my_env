#include <stdio.h> 
#include <stdlib.h> 
#include <string.h>
#include <dirent.h> 
#include <time.h>
#include <sys/stat.h>

struct File {
    short date;
    char path[400];
    struct File* next;
};

struct File* dir_contents(char* path, struct File* chain, char** filters) {
    DIR *dr = opendir(path); 

    struct File *file;
    struct dirent *de;  // Pointer for directory entry 
    struct stat b;
    int idx = 0;

    while ((de = readdir(dr)) != NULL)  {
        char newPath[500];
        char t[ 100 ] = "";
        int filterIdx;
        char * subStr;
        _Bool escape = 0;
        strcpy(newPath, path);
        strcat(newPath, "/");
        strcat(newPath, de->d_name);

        stat(newPath, &b);

        switch (de->d_type) {
            case DT_REG:
                printf("");

                filterIdx = -1;
                escape = 0;
                while (filters[++filterIdx] != NULL) {
                    if (strstr(newPath, filters[filterIdx]) == NULL) {
                        escape = 1;
                        break;
                    }
                }
                if (escape) break;


                file = malloc(sizeof(struct File));
                file->date = b.st_mtime;

                strcpy(file->path, newPath);
                file->next = chain;
                chain = file;
                idx++;

                break;
            case DT_DIR:
                if (strcmp(de->d_name, ".")
                        && strcmp(de->d_name, "..")
                        && strcmp(de->d_name, "node_modules")
                        && strcmp(de->d_name, "target")
                        && strcmp(de->d_name, "__pycache__")
                        && strcmp(de->d_name, "cache")
                        && strcmp(de->d_name, "coverage")
                        && strcmp(de->d_name, "dist")
                        && strcmp(de->d_name, ".git")
                        && strcmp(de->d_name, ".npm")
                        && strcmp(de->d_name, ".kube")
                        && strcmp(de->d_name, ".cache")
                   ) {
                    chain = dir_contents(newPath, chain, filters);
                }
                break;
        }
    }
    closedir(dr);     
    return chain;
}

int getChainLength(struct File* chain) {
    if (chain == NULL) return 0;
    int count = 1;
    while ((chain = chain->next))
        count++;
    return count;
}

/* sorts the linked list by changing next pointers (not data) */
struct File* sort(struct File* chain) 
{
    if (chain == NULL) return chain;
    _Bool ok = 0;
    struct File *first = chain, *tmp, *lastOne;

    while (!ok) {
        ok = 1;
        chain = first;

        if (chain->date > chain->next->date) {
            chain = first->next;
            first->next = chain->next;
            chain->next = first;
            first = chain;
        }

        while (chain->next->next != NULL) {
            // taking first out...
            if (chain->next->date == 0)
                chain->next = chain->next->next;

            if (chain->next->date > chain->next->next->date) {
                tmp = chain->next;
                chain->next = tmp->next;
                tmp->next = chain->next->next;
                chain->next->next = tmp;

                ok = 0;
            }

            chain = chain->next;
        }
    }

    return first;
} 

void displayChain(struct File *chain) {
    if (chain == NULL) return;
    printf("%s\n", chain->path);
    while ((chain = chain->next))
        printf("%s\n", chain->path);
}

int main(int argc, char** argv) 
{ 
    struct File first, *ref, *last;
    first.next = NULL;
    first.date = 0;
    _Bool should_sort = 1;

    void* paths[10];
    void* filters[10];
    int pathsIdx = 0;
    int filtersIdx = 0;
    for (int i=1 ; i<argc ; i++) {
        if (argv[i][0] == '-' && argv[i][1] == '-') {
            if (!strcmp(argv[i], "--help")) {
                printf("\n");
                printf("find-file, used to.. find files.. Yeah\n");
                printf("\n");
                printf("  find-file [path1 path2 filter1 path3 filter2 ...] [--no-sort]\n");
                printf("\n");
                printf("    paths:     Just paths, relative or absolute\n");
                printf("    filters:   Substring which should appear in the path of the file. No regex\n");
                printf("    --no-sort: Disable sorting of the files by modification time, improve performances\n");
                printf("    --help:    Prints this\n");
                printf("\n");
                printf("     example:\n");
                printf("       find-file ~/Documents/ Harry ~/.books/ .epub\n");
                printf("       => Will give all epub files which name contains 'Harry' contained in ~/Documents or in ~/.books\n");
                printf("\n");
                return 0;
            } else if (!strcmp(argv[i], "--no-sort")) {
                should_sort = 0;
            }
            continue;
        }
        DIR *dr = opendir(argv[i]);
        if (dr == NULL) {
            filters[filtersIdx] = argv[i];
            filtersIdx++;
        } else {
            paths[pathsIdx] = argv[i];
            pathsIdx++;
        }
    }

    if (pathsIdx == 0) {
        ref = dir_contents(".", &first, (char**)filters);
        if (ref == &first) return 1;
        if (should_sort) ref = sort(ref);
        displayChain(ref);
    } else {
        while (pathsIdx--) {
            ref = dir_contents(paths[pathsIdx], &first, (char**)filters);
            if (ref == &first) return 1;
            if (should_sort) ref = sort(ref);
            displayChain(ref);
        }
    }

    return 0; 
} 
