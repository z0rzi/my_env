#include <stdio.h>
#include <stdlib.h>
#include <string.h>

#define INSERT_FREQUENCY 10000

int main(int argc, char** argv) {
    FILE * fp;
    char * line = NULL;
    size_t len = 0;
    
    if( argc != 2 ) {
        printf("USAGE = '%s <file name>'\n", argv[0]);
        exit( EXIT_FAILURE );
    }

    fp = fopen(argv[1], "r");
    if (fp == NULL)
        exit(EXIT_FAILURE);

    int c=0;
    int length = 0;
    while (getline(&line, &len, fp) != -1) {
        length = strlen(line);

        if(!( ( c+1 ) % INSERT_FREQUENCY )) {
            printf("%s\n", ( line+45*sizeof(char) ));
        } else if(!( c % INSERT_FREQUENCY )) {
            line[length-2] = '\0';
            printf("%s,\n", line);
        } else {
            line[length-2] = '\0';
            printf("%s,\n", (line+45*sizeof(char)));
        }

        if(c>= 10100) break;

        c++;
    }


    fclose(fp);
    if (line)
        free(line);
    exit(EXIT_SUCCESS);
}
