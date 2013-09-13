To collect performance results:
1. Open [the page](http://web-ui-fw.github.io/extend-vs-assign/extend-vs-assign.html) in a browser
2. Open the js console and clear it
3. Hard-refresh the page many times (Ctrl+Shift+R). This assumes the js console
   is not cleared between refreshes. If it is cleared, record the line printed
   before doing the next refresh.
4. Run the following command line in a terminal emulator. It will hang waiting
   for input.

    ```JS
cat - | awk -v 'old=0' -v 'oldcount=0' -v 'new=0' -v 'newcount=0' '
{
  if ($1 == "assign:") {
    new = new + $2; newcount++; 
  } else {
    old = old + $2; oldcount++;
  }
}
END {
  print( "assign: " ( new / newcount ) ", extend: " ( old / oldcount ) );
}'
    ```

5. Paste the output of the console into the terminal emulator. Make sure there
   is exactly one newline at the end.
6. Press Ctrl+D (EOF)

At this point, you should see the average page load time in ms for the version
of the library that uses $.extend ("extend") as well as the one that uses
assignment ("assign")
