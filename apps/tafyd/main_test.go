package main

import "testing"

func TestBasic(t *testing.T) {
	// Basic test to ensure test framework is working
	if 1+1 != 2 {
		t.Error("Basic math failed")
	}
}