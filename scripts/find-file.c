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

struct File* dir_contents(char* path, struct File* chain) {
    DIR *dr = opendir(path); 

    struct File *file;
    struct dirent *de;  // Pointer for directory entry 
    struct stat b;
    int idx = 0;

    while ((de = readdir(dr)) != NULL)  {
        char newPath[500];
        char t[ 100 ] = "";
        strcpy(newPath, path);
        strcat(newPath, "/");
        strcat(newPath, de->d_name);

        stat(newPath, &b);

        switch (de->d_type) {
            case DT_REG:
                printf("");

                file = malloc(sizeof(struct File));
                file->date = b.st_mtime;

                file->next = NULL;
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
                    chain = dir_contents(newPath, chain);
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

int main(int argc, char** argv) 
{ 
    struct File first, *ref, *last;
    first.next = NULL;
    first.date = 0;
    if (argc == 1) {
        ref = dir_contents(".", &first);

        while (ref->next != NULL) {
            printf("%s\n", ref->path);
            last = ref;
            ref = ref->next;
            free(last);
        }
    }
    for (int i=1 ; i<argc ; i++) {

        ref = dir_contents(argv[i], &first);

        ref = sort(ref);
        last = ref;

        printf("%s\n", ref->path);
        while ((ref = ref->next)) {
            /* free(last); */
            last = ref;
            printf("%s\n", ref->path);
        }
    }

    return 0; 
} 
